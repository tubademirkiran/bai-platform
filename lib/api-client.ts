/** Client-side JSON API helper. Never lets an error response masquerade as an empty result. */
export async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || `İstek başarısız oldu (HTTP ${response.status}).`)
  }
  if (!data || !('result' in data) || data.result == null) {
    throw new Error('Sunucu kullanılabilir bir sonuç döndürmedi. Lütfen tekrar deneyin.')
  }
  return data.result as T
}
