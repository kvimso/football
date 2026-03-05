'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { uuidSchema } from '@/lib/validations'

const tagSchema = z.string().min(1).max(30)
const MAX_TAGS_PER_ENTRY = 10

export async function addTag(watchlistId: string, tag: string) {
  if (!uuidSchema.safeParse(watchlistId).success) return { error: 'errors.invalidId' }
  if (!tagSchema.safeParse(tag).success) return { error: 'errors.invalidInput' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  // Check tag limit per watchlist entry
  const { count, error: countError } = await supabase
    .from('watchlist_tags')
    .select('*', { count: 'exact', head: true })
    .eq('watchlist_id', watchlistId)
    .eq('user_id', user.id)

  if (countError) {
    console.error('[watchlist-tags] Count error:', countError.message)
    return { error: 'errors.serverError' }
  }
  if ((count ?? 0) >= MAX_TAGS_PER_ENTRY) return { error: 'errors.tagLimitReached' }

  const { error } = await supabase
    .from('watchlist_tags')
    .insert({ user_id: user.id, watchlist_id: watchlistId, tag: tag.toLowerCase().trim() })

  if (error) {
    console.error('[watchlist-tags] Insert error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}

export async function removeTag(tagId: string) {
  if (!uuidSchema.safeParse(tagId).success) return { error: 'errors.invalidId' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist_tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[watchlist-tags] Delete error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}
