/**
 * Merkezi Groq client'ı.
 *
 * Tüm AI route'ları buradan geçer. Model adı, endpoint, header ve hata eşlemesi
 * tek yerde tutulur — böylece model değiştirmek 15 dosya yerine tek satır düzenlemek olur.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

/** Kullanılan tek model. Değiştirmek istersen sadece burayı düzenle. */
export const GROQ_MODEL = 'llama-3.3-70b-versatile'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export interface GroqOptions {
  /** Tek atımlık system prompt (messages verilmediyse). */
  system?: string
  /** Tek atımlık user prompt (messages verilmediyse). */
  user?: string
  /** Çok turlu konuşma; verilirse system/user yok sayılır. */
  messages?: ChatMessage[]
  /** JSON modu (response_format: json_object). */
  json?: boolean
  maxTokens?: number
  temperature?: number
}

/** Groq API anahtarını doğrular; yoksa anlamlı hata fırlatır. */
function getApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new GroqError('GROQ_API_KEY tanımlı değil.', 500)
  return key
}

/** Route'ların doğru HTTP status'ü iletebilmesi için tipli hata. */
export class GroqError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'GroqError'
    this.status = status
  }
}

function buildMessages(opts: GroqOptions): ChatMessage[] {
  if (opts.messages && opts.messages.length) return opts.messages
  const msgs: ChatMessage[] = []
  if (opts.system) msgs.push({ role: 'system', content: opts.system })
  if (opts.user) msgs.push({ role: 'user', content: opts.user })
  return msgs
}

/**
 * Groq'a istek atar ve ham metin (message.content) döndürür.
 * Groq'un gerçek HTTP status'ünü GroqError üzerinden yukarı taşır.
 */
export async function callGroq(opts: GroqOptions): Promise<string> {
  const apiKey = getApiKey()

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages: buildMessages(opts),
    max_tokens: opts.maxTokens ?? 2000,
    temperature: opts.temperature ?? 0.3,
  }
  if (opts.json) body.response_format = { type: 'json_object' }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.error?.message || 'Groq API hatası'
    // 429/401/400 gibi anlamlı kodları koru; bilinmeyeni 502'ye çevir (upstream).
    const status = response.status >= 400 && response.status < 600 ? response.status : 502
    throw new GroqError(message, status)
  }

  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new GroqError('Groq beklenen formatta yanıt dönmedi.', 502)
  }
  return content
}

/** ```json ... ``` fence'lerini ve baştaki/sondaki gürültüyü temizler. */
function stripFences(text: string): string {
  return text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
}

/** İlk `{...}` veya `[...]` bloğunu çıkarır (model açıklama eklemişse). */
function extractJsonBlock(text: string): string {
  const match = text.match(/[[{][\s\S]*[\]}]/)
  return match ? match[0] : text
}

/**
 * JSON çıktı üreten route'lar için. Önce json_object modunu dener; parse başarısızsa
 * fence-strip + blok-çıkarma ile bir kez daha dener. Hâlâ başarısızsa GroqError fırlatır.
 */
export async function callGroqJSON<T = unknown>(opts: GroqOptions): Promise<T> {
  const raw = await callGroq({ ...opts, json: true })

  try {
    return JSON.parse(raw) as T
  } catch {
    try {
      return JSON.parse(extractJsonBlock(stripFences(raw))) as T
    } catch {
      throw new GroqError('Yapay zeka geçerli bir JSON formatı üretemedi.', 502)
    }
  }
}

/**
 * Bir stream'i geçirirken tüm metni biriktirir ve akış bitince onComplete'i çağırır.
 * Streaming route'larda, yanıt tamamlandıktan sonra geçmişe tam metni kaydetmek için kullanılır.
 */
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

/**
 * Streaming yanıt. Groq SSE ("data: {...}") akışını token token okuyup
 * düz metin parçalarını yield eden bir ReadableStream<Uint8Array> döndürür.
 * Route'lar bunu doğrudan Response gövdesi olarak geçirebilir.
 */
export async function streamGroq(opts: GroqOptions): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey()

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildMessages(opts),
      max_tokens: opts.maxTokens ?? 2000,
      temperature: opts.temperature ?? 0.3,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null)
    const status = response.status >= 400 && response.status < 600 ? response.status : 502
    throw new GroqError(data?.error?.message || 'Groq streaming hatası', status)
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
          buffer = lines.pop() ?? '' // son (yarım) satırı sakla

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
              const delta = json?.choices?.[0]?.delta?.content
              if (delta) controller.enqueue(encoder.encode(delta))
            } catch {
              // yarım/parça JSON — yok say, sonraki chunk tamamlar
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
