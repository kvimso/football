'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { uuidSchema } from '@/lib/validations'

const notesSchema = z.string().max(2000)

export async function addToWatchlist(playerId: string) {
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[watchlist] Auth error:', authError.message)
    return { error: 'errors.serverError' }
  }
  if (!user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: user.id, player_id: playerId })

  if (error) {
    if (error.code === '23505') return { error: 'errors.alreadyWatched' }
    console.error('[watchlist] DB error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  revalidatePath('/players', 'layout')
  return { success: true }
}

export async function removeFromWatchlist(playerId: string) {
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[watchlist] Auth error:', authError.message)
    return { error: 'errors.serverError' }
  }
  if (!user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('player_id', playerId)

  if (error) {
    console.error('[watchlist] DB error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  revalidatePath('/players', 'layout')
  return { success: true }
}

export async function updateWatchlistNotes(playerId: string, notes: string) {
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  if (!notesSchema.safeParse(notes).success) return { error: 'errors.notesTooLong' }
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[watchlist] Auth error:', authError.message)
    return { error: 'errors.serverError' }
  }
  if (!user) return { error: 'errors.notAuthenticated' }

  const { error } = await supabase
    .from('watchlist')
    .update({ notes })
    .eq('user_id', user.id)
    .eq('player_id', playerId)

  if (error) {
    console.error('[watchlist] DB error:', error.message)
    return { error: 'errors.serverError' }
  }

  revalidatePath('/dashboard/watchlist')
  return { success: true }
}
