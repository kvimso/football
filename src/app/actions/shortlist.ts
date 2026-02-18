'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addToShortlist(playerId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return { error: authError.message }
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('shortlists')
    .insert({ scout_id: user.id, player_id: playerId })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/shortlist')
  revalidatePath('/players', 'layout')
  return { success: true }
}

export async function removeFromShortlist(playerId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return { error: authError.message }
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('shortlists')
    .delete()
    .eq('scout_id', user.id)
    .eq('player_id', playerId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/shortlist')
  revalidatePath('/players', 'layout')
  return { success: true }
}

export async function updateShortlistNote(playerId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return { error: authError.message }
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('shortlists')
    .update({ notes })
    .eq('scout_id', user.id)
    .eq('player_id', playerId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/shortlist')
  return { success: true }
}
