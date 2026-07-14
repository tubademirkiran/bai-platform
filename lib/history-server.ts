import { createClient } from '@/lib/supabase-server'

/**
 * Server tarafında (route handler) geçmişe kayıt. Oturumu cookie'den okur,
 * RLS altında kullanıcının kendi satırını ekler. Hata durumunda üretimi bozmamak
 * için sessizce loglar — kayıt başarısızlığı asıl yanıtı etkilemez.
 *
 * Tüm üretim modülleri bu tek fonksiyondan geçtiği için Analytics & History
 * tutarlı, tam veriyle çalışır.
 */
export async function saveHistoryServer(module: string, input: string, output: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('history').insert({
      user_id: user.id,
      module,
      input: input?.slice(0, 8000) ?? '',
      output: output?.slice(0, 20000) ?? '',
    })
  } catch (err) {
    console.error('History kaydı başarısız:', err)
  }
}
