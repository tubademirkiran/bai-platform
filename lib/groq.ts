const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'

/**
 * Birincil model. GEMINI_MODEL ortam değişkeni ile geçersiz kılınabilir.
 *
 * DİKKAT — model isimleri hızla emekliye ayrılıyor VE tek tek aşırı yüklenebiliyor:
 *  - gemini-1.5-flash / gemini-2.0-flash : tamamen kaldırıldı, 404 döner.
 *  - gemini-2.5-flash : ListModels listesinde görünür ama yeni anahtarlara
 *    kapalı, 404 döner. Listede olması kullanılabilir olduğu anlamına gelmiyor.
 *  - gemini-3.5 / 3.7 / 3.8-flash : 2026-09-25 ölçümünde KALICI 503
 *    ("experiencing high demand") — her denemede başarısız.
 *  - gemini-3.6-flash / gemini-flash-latest / gemini-3-flash-preview : doğrulandı.
 * Model değiştirmeden önce gerçek bir chat/completions isteğiyle test et.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

/**
 * Birincil model 503/429 verirse sırayla denenecek yedekler.
 *
 * NEDEN: 2026-09-25'te gemini-3.5-flash saatlerce 503 döndü ve tek model'e bağlı
 * olan 16 aracın TAMAMI yanıtsız kaldı. Tek bir modelin aşırı yüklenmesi artık
 * platformu durdurmasın. GEMINI_FALLBACK_MODELS ile (virgüllü) değiştirilebilir.
 */
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-flash-latest,gemini-3-flash-preview')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)

/** Denenecek model sırası; tekrarlar ayıklanır. */
const MODEL_CHAIN = [...new Set([GEMINI_MODEL, ...FALLBACK_MODELS])]

/** Geçici hatalar — aynı modelde tekrar denemeye değer. */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
/** Model başına deneme sayısı (ilk istek dahil). */
const ATTEMPTS_PER_MODEL = 2
/** Denemeler arası bekleme; 503 genelde ~1sn içinde döndüğü için kısa tutuldu. */
const RETRY_BACKOFF_MS = [400, 1200]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export interface GroqOptions {
  system?: string
  user?: string
  messages?: ChatMessage[]
  json?: boolean
  jsonSchema?: Record<string, unknown>
  /** İstenen GÖRÜNÜR çıktı bütçesi. Düşünme payı otomatik eklenir (bkz. resolveMaxTokens). */
  maxTokens?: number
  temperature?: number
  /** Düşünme derinliği. 'none' = hiç düşünme (hızlı/ucuz, mekanik işler için). */
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high'
}

/**
 * KRİTİK — Gemini 3.x "düşünme" (thinking) tokenları max_tokens bütçesinden harcanır
 * ama usage.completion_tokens içinde RAPORLANMAZ. Ölçtüğümüz gerçek örnek:
 *
 *   max_tokens: 4000  -> finish_reason: "length", completion_tokens: 159  (düşünme 3837 yemiş)
 *   max_tokens: 16000 -> finish_reason: "stop",   completion_tokens: 4275 (düşünme 4241)
 *
 * Yani Groq/llama döneminden kalan 800-4000 arası maxTokens değerleri Gemini'de
 * ya çıktıyı ortasından kesiyor ya da hiç çıktı bırakmıyordu. Bu yüzden maxTokens'ı
 * "görünür çıktı bütçesi" olarak koruyup, düşünme payını üstüne biz ekliyoruz —
 * böylece 15 route'un hiçbirine dokunmadan hepsi doğru davranır.
 */
const THINKING_HEADROOM = 8000
/** gemini-3.5-flash outputTokenLimit */
const MODEL_OUTPUT_LIMIT = 65536

function resolveMaxTokens(maxTokens?: number): number {
  return Math.min((maxTokens ?? 4000) + THINKING_HEADROOM, MODEL_OUTPUT_LIMIT)
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new GroqError('GEMINI_API_KEY tanımlı değil.', 500)
  return key
}

export class GroqError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'GroqError'
    this.status = status
  }
}

/**
 * Gemini'nin OpenAI uyumlu uç noktası hataları ÜST SEVİYE DİZİ olarak döner:
 *   [{ "error": { "code": 404, "message": "...", "status": "NOT_FOUND" } }]
 * OpenAI/Groq ise düz nesne döner: { "error": { "message": "..." } }.
 * Bu yüzden `data?.error?.message` dizi durumunda undefined kalıyor ve gerçek
 * hata mesajı yutulup yerine anlamsız "HTTP 404" metni geçiyordu. Her iki şekli de ele al.
 */
function extractErrorMessage(data: unknown, status: number): string {
  const node = Array.isArray(data) ? data[0] : data
  if (node && typeof node === 'object') {
    const err = (node as Record<string, unknown>).error
    if (err && typeof err === 'object') {
      const msg = (err as Record<string, unknown>).message
      if (typeof msg === 'string' && msg.trim()) return msg
    }
    const msg = (node as Record<string, unknown>).message
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  return `Gemini API hatası (HTTP ${status})`
}

/**
 * İsteği model zinciri boyunca dener ve BAŞARILI Response'u döndürür.
 *
 * Sıra: her model için en fazla ATTEMPTS_PER_MODEL deneme (geçici hatalarda
 * backoff'lu), sonra zincirdeki bir sonraki modele geç.
 *  - 400/401/403  -> kalıcı istek/anahtar hatası, hemen fırlat (yedek denemeye gerek yok)
 *  - 404          -> model bu anahtara kapalı, tekrar deneme; doğrudan sonraki modele geç
 *  - 429/5xx      -> geçici, aynı modelde tekrar dene; tükenirse sonraki modele geç
 *
 * @param buildBody Model adını alıp istek gövdesini üreten fonksiyon.
 */
async function fetchWithFallback(
  buildBody: (model: string) => Record<string, unknown>
): Promise<Response> {
  const apiKey = getApiKey()
  let lastError: GroqError | null = null

  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
      let response: Response
      try {
        response = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(buildBody(model)),
          signal: AbortSignal.timeout(60_000),
        })
      } catch (error) {
        // Ağ/timeout — geçici say, tekrar dene.
        lastError = new GroqError(
          error instanceof Error && error.name === 'TimeoutError'
            ? 'Yapay zeka servisi zaman aşımına uğradı. Lütfen tekrar deneyin.'
            : 'Yapay zeka servisine ulaşılamadı. Lütfen bağlantıyı ve API anahtarını kontrol edin.',
          502
        )
        if (attempt < ATTEMPTS_PER_MODEL - 1) await sleep(RETRY_BACKOFF_MS[attempt])
        continue
      }

      if (response.ok) {
        if (model !== GEMINI_MODEL) {
          console.warn(`[gemini] Birincil model "${GEMINI_MODEL}" kullanılamadı; "${model}" ile yanıt alındı.`)
        }
        return response
      }

      // Hata gövdesini oku (akış modunda da JSON döner).
      const data = await response.json().catch(() => null)
      const status = response.status >= 400 && response.status < 600 ? response.status : 502
      lastError = new GroqError(extractErrorMessage(data, response.status), status)

      if (status === 400 || status === 401 || status === 403) throw lastError
      if (status === 404) break // model kapalı — beklemeden sonraki modele geç
      if (!RETRYABLE_STATUS.has(status)) break

      console.warn(`[gemini] ${model} HTTP ${status} (deneme ${attempt + 1}/${ATTEMPTS_PER_MODEL})`)
      if (attempt < ATTEMPTS_PER_MODEL - 1) await sleep(RETRY_BACKOFF_MS[attempt])
    }
  }

  throw (
    lastError ??
    new GroqError('Yapay zeka servisine ulaşılamadı. Lütfen tekrar deneyin.', 502)
  )
}

function buildMessages(opts: GroqOptions): ChatMessage[] {
  if (opts.messages && opts.messages.length) return opts.messages
  const msgs: ChatMessage[] = []
  if (opts.system) msgs.push({ role: 'system', content: opts.system })
  if (opts.user) msgs.push({ role: 'user', content: opts.user })
  return msgs
}

export async function callGroq(opts: GroqOptions): Promise<string> {
  const buildBody = (model: string): Record<string, unknown> => {
    const body: Record<string, unknown> = {
      model,
      messages: buildMessages(opts),
      max_tokens: resolveMaxTokens(opts.maxTokens),
      temperature: opts.temperature ?? 0.1, // Düşük sıcaklık JSON tutarlılığını artırır
    }
    if (opts.reasoningEffort) body.reasoning_effort = opts.reasoningEffort

    // Gemini OpenAI entegrasyonu için doğru response_format yapılandırması
    if (opts.json) {
      body.response_format = opts.jsonSchema
        ? { type: 'json_schema', json_schema: { name: 'response', schema: opts.jsonSchema } }
        : { type: 'json_object' }
    }
    return body
  }

  const response = await fetchWithFallback(buildBody)
  const data = await response.json().catch(() => null)

  const choice = data?.choices?.[0]
  const message = choice?.message
  const content =
    typeof message?.content === 'string'
      ? message.content
      : Array.isArray(message?.content)
        ? message.content
            .map((part: unknown) =>
              typeof part === 'object' && part && 'text' in part && typeof part.text === 'string'
                ? part.text
                : ''
            )
            .join('')
        : message?.parsed && typeof message.parsed === 'object'
          ? JSON.stringify(message.parsed)
          : null

  // Bütçe bitip çıktı ortadan kesildiyse sessizce yarım veri döndürme — sessiz kesilme
  // JSON route'larında "geçersiz JSON", Markdown route'larında yarım döküman olarak görünüyordu.
  if (choice?.finish_reason === 'length') {
    throw new GroqError(
      'Yapay zeka yanıtı token bütçesi dolduğu için yarıda kesildi. Lütfen tekrar deneyin.',
      502
    )
  }

  if (!content) {
    throw new GroqError('Yapay zeka beklenen formatta yanıt dönmedi.', 502)
  }
  return content
}

/** JSON string içerisindeki gürültüleri ve Markdown bloklarını temizler. */
function sanitizeJsonString(rawText: string): string {
  let cleaned = rawText.trim()
  
  // ```json ve ``` takılarını temizle
  cleaned = cleaned.replace(/^```(?:json)?/gi, '').replace(/```$/gi, '').trim()

  // İlk JSON karakteri ({ veya [) ile son kapanışı (} veya ]) arasında kalan kısmı ayıkla
  const firstBrace = cleaned.search(/[\{\[]/)
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return cleaned
}

export async function callGroqJSON<T = unknown>(opts: GroqOptions): Promise<T> {
  const raw = await callGroq({ ...opts, json: true })

  // 1. Doğrudan parse etmeyi dene
  try {
    const parsed = JSON.parse(raw) as T
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      return parsed
    }
  } catch {
    // Doğrudan parse başarısız olursa temizleme adımına geç
  }

  // 2. Temizlenmiş string üzerinden parse etmeyi dene
  try {
    const cleaned = sanitizeJsonString(raw)
    const parsed = JSON.parse(cleaned) as T
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      return parsed
    }
  } catch {
    // Temizlenmiş veri de parse edilemedi
  }

  throw new GroqError('Yapay zeka geçerli bir JSON formatı üretemedi.', 502)
}

export function captureStream(
  stream: ReadableStream<Uint8Array>,
  onComplete: (fullText: string) => void | Promise<void>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  let full = ''
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      full += decoder.decode(chunk, { stream: true })
      controller.enqueue(chunk)
    },
    async flush() {
      try {
        await onComplete(full)
      } catch (err) {
        console.error('captureStream onComplete hatası:', err)
      }
    },
  })
  return stream.pipeThrough(transform)
}

export async function streamGroq(opts: GroqOptions): Promise<ReadableStream<Uint8Array>> {
  // Yeniden deneme/yedek model seçimi akış BAŞLAMADAN önce biter; istemciye
  // yalnızca çalışan bir modelin gövdesi aktarılır.
  const response = await fetchWithFallback((model) => ({
    model,
    messages: buildMessages(opts),
    max_tokens: resolveMaxTokens(opts.maxTokens),
    temperature: opts.temperature ?? 0.1,
    ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
    stream: true,
  }))

  if (!response.body) {
    throw new GroqError('Yapay zeka servisi boş bir akış döndürdü. Lütfen tekrar deneyin.', 502)
  }

  const upstream = response.body
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader()
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue
            const payload = trimmed.slice(5).trim()
            if (payload === '[DONE]') {
              controller.close()
              return
            }
            try {
              const json = JSON.parse(payload)
              const choice = json?.choices?.[0]
              const delta = choice?.delta?.content
              if (delta) controller.enqueue(encoder.encode(delta))
              // Streaming'de kesilme hata olarak fırlatılamaz (kullanıcı o ana kadarki
              // metni zaten görüyor); en azından sunucu logunda görünür olsun.
              if (choice?.finish_reason === 'length') {
                console.warn(
                  '[groq] Yanıt token bütçesi dolduğu için kesildi. İlgili route için maxTokens değerini artırın.'
                )
              }
            } catch {
              // Parçalı JSON paketlerini atla
            }
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      } finally {
        reader.releaseLock()
      }
    },
  })
}