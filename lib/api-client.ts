/**
 * Client-side JSON API helper. Never lets an error response masquerade as an empty result.
 *
 * Tüm JSON route'ları başarıda `{ result }`, hatada `{ error }` + 4xx/5xx döner.
 * Sayfalar bu yardımcıyı kullanmalı; ham `fetch` + `data.result` kullanımı hata
 * gövdesini yutar ve kullanıcı sessizce boş ekranla kalır.
 */

/** Ağ/oturum katmanındaki hataları kullanıcıya anlaşılır Türkçe metne çevirir. */
function statusMessage(status: number, fallback: string): string {
  if (status === 401) return 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.'
  if (status === 429) return 'Çok fazla istek gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.'
  if (status === 503) return 'Yapay zeka servisi şu anda yoğun. Lütfen birazdan tekrar deneyin.'
  return fallback
}

async function request(endpoint: string, body: unknown, signal?: AbortSignal): Promise<any> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.')
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      statusMessage(response.status, data?.error || `İstek başarısız oldu (HTTP ${response.status}).`)
    )
  }
  return data
}

/** `{ result }` döndüren route'lar için. Sonuç boşsa hata fırlatır. */
export async function postJson<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const data = await request(endpoint, body, signal)
  const empty =
    !data ||
    !('result' in data) ||
    data.result == null ||
    // Boş string / boş nesne de "sonuç yok" demektir; ekranı sessizce boş bırakmasın.
    (typeof data.result === 'string' && !data.result.trim()) ||
    (typeof data.result === 'object' && Object.keys(data.result).length === 0)

  if (empty) {
    throw new Error('Sunucu kullanılabilir bir sonuç döndürmedi. Lütfen tekrar deneyin.')
  }
  return data.result as T
}

/**
 * `{ result }` yerine kendi alanlarını döndüren route'lar (ör. SQL: `{ sql, explanation }`).
 * `requiredKeys` içindeki alanlardan biri eksikse sessiz boş ekran yerine hata fırlatır.
 */
export async function postJsonFields<T extends Record<string, unknown>>(
  endpoint: string,
  body: unknown,
  requiredKeys: (keyof T)[],
  signal?: AbortSignal
): Promise<T> {
  const data = await request(endpoint, body, signal)
  const missing = requiredKeys.filter((k) => data?.[k] == null)
  if (missing.length) {
    throw new Error('Sunucu kullanılabilir bir sonuç döndürmedi. Lütfen tekrar deneyin.')
  }
  return data as T
}
