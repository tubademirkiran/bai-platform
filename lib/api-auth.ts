import { createClient } from '@/lib/supabase-server'
import type { User } from '@supabase/supabase-js'

/**
 * Route handler'larda oturumu doğrular. Oturum yoksa null döner.
 * Cookie tabanlı session'ı server client üzerinden okur (bkz. lib/supabase-server.ts).
 */
export async function requireUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
