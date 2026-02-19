'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { platformPlayerFormSchema } from '@/lib/validations'
import { getPlatformAdminContext } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

export async function platformCreatePlayer(data: Record<string, unknown>) {
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'Unauthorized' }

  const parsed = platformPlayerFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const name = `${parsed.data.first_name} ${parsed.data.last_name}`
  const name_ka = `${parsed.data.first_name_ka} ${parsed.data.last_name_ka}`
  const slug = generateSlug(name)

  const { data: existing } = await admin
    .from('players')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const clubId = parsed.data.club_id || null
  const status = clubId ? (parsed.data.status ?? 'active') : 'free_agent'

  const { data: newPlayer, error: insertError } = await admin
    .from('players')
    .insert({
      name,
      name_ka,
      club_id: clubId,
      slug: finalSlug,
      date_of_birth: parsed.data.date_of_birth,
      position: parsed.data.position,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      parent_guardian_contact: parsed.data.parent_guardian_contact ?? null,
      status,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // Insert club history if assigned to a club
  if (newPlayer && clubId) {
    const { error: historyError } = await admin
      .from('player_club_history')
      .insert({
        player_id: newPlayer.id,
        club_id: clubId,
        joined_at: new Date().toISOString().split('T')[0],
      })

    if (historyError) console.error('Failed to insert club history:', historyError.message)
  }

  revalidatePath('/platform/players')
  revalidatePath('/players')
  return { success: true }
}

export async function platformUpdatePlayer(playerId: string, data: Record<string, unknown>) {
  if (!z.string().uuid().safeParse(playerId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'Unauthorized' }

  const parsed = platformPlayerFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // Get current player state
  const { data: currentPlayer, error: fetchErr } = await admin
    .from('players')
    .select('id, club_id, status')
    .eq('id', playerId)
    .single()

  if (fetchErr || !currentPlayer) return { error: 'Player not found' }

  const name = `${parsed.data.first_name} ${parsed.data.last_name}`
  const name_ka = `${parsed.data.first_name_ka} ${parsed.data.last_name_ka}`
  const newClubId = parsed.data.club_id || null
  const newStatus = newClubId ? (parsed.data.status ?? 'active') : 'free_agent'

  const { error: updateError } = await admin
    .from('players')
    .update({
      name,
      name_ka,
      club_id: newClubId,
      date_of_birth: parsed.data.date_of_birth,
      position: parsed.data.position,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      parent_guardian_contact: parsed.data.parent_guardian_contact ?? null,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)

  if (updateError) return { error: updateError.message }

  // Handle club change
  const today = new Date().toISOString().split('T')[0]
  if (currentPlayer.club_id !== newClubId) {
    // Close old club history
    if (currentPlayer.club_id) {
      await admin
        .from('player_club_history')
        .update({ left_at: today })
        .eq('player_id', playerId)
        .eq('club_id', currentPlayer.club_id)
        .is('left_at', null)
    }
    // Open new club history
    if (newClubId) {
      await admin
        .from('player_club_history')
        .insert({
          player_id: playerId,
          club_id: newClubId,
          joined_at: today,
        })
    }
  }

  revalidatePath('/platform/players')
  revalidatePath('/players')
  return { success: true }
}

export async function platformDeletePlayer(playerId: string) {
  if (!z.string().uuid().safeParse(playerId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'Unauthorized' }

  const { error: deleteError } = await admin
    .from('players')
    .delete()
    .eq('id', playerId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath('/platform/players')
  revalidatePath('/players')
  return { success: true }
}
