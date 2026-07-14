import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cookie tabanlı browser client. Oturum artık localStorage yerine cookie'de tutulur,
// böylece middleware ve API route'lar (server) da oturumu okuyabilir.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
