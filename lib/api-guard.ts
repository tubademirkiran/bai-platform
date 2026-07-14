import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import type { User } from '@supabase/supabase-js'

/**
 * Route handler'lar için tek adımda auth + rate-limit kapısı.
 *
 * Kullanım:
 *   const gate = await guard('requirement')
 *   if (gate.error) return gate.error
 *   const user = gate.user
 *
 * @param endpoint   Rate-limit anahtarında kullanılan endpoint adı.
 * @param limit      Dakikadaki istek limiti (varsayılan 20).
 */
export async function guard(
  endpoint: string,
  limit = 20
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  const user = await requireUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Oturum gerekli. Lütfen giriş yapın.' }, { status: 401 }),
    }
  }

  const rl = rateLimit(`${user.id}:${endpoint}`, limit)
  if (!rl.success) {
    const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Çok fazla istek. Lütfen biraz bekleyin.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      ),
    }
  }

  return { user, error: null }
}
