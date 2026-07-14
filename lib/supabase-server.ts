import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server tarafı Supabase client'ı (Server Component, Route Handler, Server Action).
 * next/headers cookies() üzerinden oturumu okur/yazar.
 *
 * Middleware KENDİ client'ını kurar (request/response cookie'leri ile) — bkz. middleware.ts.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component içinden çağrıldığında set() atılır; middleware oturumu
            // zaten tazelediği için bu güvenle yok sayılabilir.
          }
        },
      },
    }
  )
}
