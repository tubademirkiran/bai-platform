/**
 * Hafif in-memory sliding-window rate limiter.
 *
 * NOT: Bellekte tutulur — TEK sunucu instance'ı için geçerlidir. Vercel gibi
 * serverless/çoklu-instance ortamda instance'lar arası paylaşılmaz. Gerçek dağıtık
 * limit gerektiğinde Upstash `@upstash/ratelimit` (Redis) ile değiştirilebilir.
 */

type Hit = { count: number; resetAt: number }

const store = new Map<string, Hit>()

// Periyodik temizlik (bellek sızıntısını önlemek için süresi geçmiş kayıtları at).
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = 0

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, hit] of store) {
    if (hit.resetAt <= now) store.delete(key)
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * @param identifier  Genelde `${userId}:${endpoint}`.
 * @param limit       Pencere başına izinli istek sayısı (varsayılan 20).
 * @param windowMs    Pencere süresi ms (varsayılan 60 sn).
 */
export function rateLimit(identifier: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const hit = store.get(identifier)

  if (!hit || hit.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (hit.count >= limit) {
    return { success: false, remaining: 0, resetAt: hit.resetAt }
  }

  hit.count += 1
  return { success: true, remaining: limit - hit.count, resetAt: hit.resetAt }
}
