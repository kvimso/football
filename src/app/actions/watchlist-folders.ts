'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { uuidSchema } from '@/lib/validations'

const folderNameSchema = z.string().min(1).max(50)
const MAX_FOLDERS = 20

export async function createFolder(name: string) {
  if (!folderNameSchema.safeParse(name).success) return { error: 'errors.invalidInput' }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  // Check folder limit
  const { count, error: countError } = await supabase
    .from('watchlist_folders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) {
    console.error('[watchlist-folders] Count error:', countError.message)
    return { error: 'errors.serverError' }
  }
  if ((count ?? 0) >= MAX_FOLDERS) return { error: 'errors.folderLimitReached' }

  const { data, error } = await supabase
    .from('watchlist_folders')
    .insert({ user_id: user.id, name })
    .select('id')
    .single()

  if (error) {
    console.error('[watchlist-folders] Insert error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true, folderId: data.id }
}

export async function renameFolder(folderId: string, name: string) {
  if (!uuidSchema.safeParse(folderId).success) return { error: 'errors.invalidId' }
  if (!folderNameSchema.safeParse(name).success) return { error: 'errors.invalidInput' }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist_folders')
    .update({ name })
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[watchlist-folders] Rename error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}

export async function deleteFolder(folderId: string) {
  if (!uuidSchema.safeParse(folderId).success) return { error: 'errors.invalidId' }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  // Deleting a folder cascades to watchlist_folder_players (junction),
  // but does NOT delete watchlist entries — players stay watched, just unfoldered
  const { error } = await supabase
    .from('watchlist_folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[watchlist-folders] Delete error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}

export async function addToFolder(folderId: string, watchlistId: string) {
  if (!uuidSchema.safeParse(folderId).success || !uuidSchema.safeParse(watchlistId).success) {
    return { error: 'errors.invalidId' }
  }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist_folder_players')
    .insert({ folder_id: folderId, watchlist_id: watchlistId })

  if (error) {
    if (error.code === '23505') return { success: true } // Already in folder
    console.error('[watchlist-folders] Add error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}

export async function removeFromFolder(folderId: string, watchlistId: string) {
  if (!uuidSchema.safeParse(folderId).success || !uuidSchema.safeParse(watchlistId).success) {
    return { error: 'errors.invalidId' }
  }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist_folder_players')
    .delete()
    .eq('folder_id', folderId)
    .eq('watchlist_id', watchlistId)

  if (error) {
    console.error('[watchlist-folders] Remove error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}
