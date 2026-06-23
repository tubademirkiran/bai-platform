import { supabase } from './supabase'

export async function saveToHistory(module: string, input: string, output: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('history').insert({
    user_id: user.id,
    module,
    input,
    output,
  })
}

export async function getHistory(module?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (module) query = query.eq('module', module)

  const { data } = await query
  return data || []
}

export async function toggleFavorite(id: string, current: boolean) {
  await supabase
    .from('history')
    .update({ is_favorite: !current })
    .eq('id', id)
}

export async function deleteHistory(id: string) {
  await supabase
    .from('history')
    .delete()
    .eq('id', id)
}