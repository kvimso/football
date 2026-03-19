'use server'

import { revalidatePath } from 'next/cache'
import { playerMappingSchema, clubMappingSchema, uuidSchema } from '@/lib/validations'
import { getPlatformAdminContext } from '@/lib/auth'
import type { Database } from '@/lib/database.types'

type ActionResult = { success: true } | { success: false; error: string }

type PlayerMapInsert = Database['public']['Tables']['starlive_player_map']['Insert']
type ClubMapInsert = Database['public']['Tables']['starlive_club_map']['Insert']

// ─── Player Mapping Actions ───

export async function createPlayerMapping(data: unknown): Promise<ActionResult> {
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const parsed = playerMappingSchema.safeParse(data)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  // Auto-populate club_id from the selected player
  const { data: player } = await admin
    .from('players')
    .select('club_id')
    .eq('id', parsed.data.player_id)
    .single()

  const insert: PlayerMapInsert = {
    player_id: parsed.data.player_id,
    starlive_player_id: parsed.data.starlive_player_id,
    starlive_team_id: parsed.data.starlive_team_id ?? null,
    club_id: player?.club_id ?? null,
    jersey_number: parsed.data.jersey_number ?? null,
    mapped_by: userId,
  }

  const { error: insertError } = await admin.from('starlive_player_map').insert(insert)

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'platform.camera.errors.duplicateStarliveId' }
    }
    console.error('[platform-camera] Create player mapping error:', insertError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/mappings')
  return { success: true }
}

export async function updatePlayerMapping(id: string, data: unknown): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return { success: false, error: 'errors.invalidId' }
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const parsed = playerMappingSchema.safeParse(data)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const { data: player } = await admin
    .from('players')
    .select('club_id')
    .eq('id', parsed.data.player_id)
    .single()

  const { error: updateError } = await admin
    .from('starlive_player_map')
    .update({
      player_id: parsed.data.player_id,
      starlive_player_id: parsed.data.starlive_player_id,
      starlive_team_id: parsed.data.starlive_team_id ?? null,
      club_id: player?.club_id ?? null,
      jersey_number: parsed.data.jersey_number ?? null,
      mapped_by: userId,
    })
    .eq('id', id)

  if (updateError) {
    if (updateError.code === '23505') {
      return { success: false, error: 'platform.camera.errors.duplicateStarliveId' }
    }
    console.error('[platform-camera] Update player mapping error:', updateError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/mappings')
  return { success: true }
}

export async function deletePlayerMapping(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return { success: false, error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const { error: deleteError } = await admin.from('starlive_player_map').delete().eq('id', id)

  if (deleteError) {
    console.error('[platform-camera] Delete player mapping error:', deleteError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/mappings')
  return { success: true }
}

// ─── Club Mapping Actions ───

export async function createClubMapping(data: unknown): Promise<ActionResult> {
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const parsed = clubMappingSchema.safeParse(data)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const insert: ClubMapInsert = {
    club_id: parsed.data.club_id,
    starlive_team_name: parsed.data.starlive_team_name,
    starlive_team_id: parsed.data.starlive_team_id ?? null,
  }

  const { error: insertError } = await admin.from('starlive_club_map').insert(insert)

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: 'platform.camera.errors.duplicateTeamName' }
    }
    console.error('[platform-camera] Create club mapping error:', insertError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/clubs')
  return { success: true }
}

export async function updateClubMapping(id: string, data: unknown): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return { success: false, error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const parsed = clubMappingSchema.safeParse(data)
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  const { error: updateError } = await admin
    .from('starlive_club_map')
    .update({
      club_id: parsed.data.club_id,
      starlive_team_name: parsed.data.starlive_team_name,
      starlive_team_id: parsed.data.starlive_team_id ?? null,
    })
    .eq('id', id)

  if (updateError) {
    if (updateError.code === '23505') {
      return { success: false, error: 'platform.camera.errors.duplicateTeamName' }
    }
    console.error('[platform-camera] Update club mapping error:', updateError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/clubs')
  return { success: true }
}

export async function deleteClubMapping(id: string): Promise<ActionResult> {
  if (!uuidSchema.safeParse(id).success) return { success: false, error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  const { error: deleteError } = await admin.from('starlive_club_map').delete().eq('id', id)

  if (deleteError) {
    console.error('[platform-camera] Delete club mapping error:', deleteError.message)
    return { success: false, error: 'errors.serverError' }
  }

  revalidatePath('/platform/camera/clubs')
  return { success: true }
}

// ─── Sync Log Actions ───

export async function getSyncLogErrors(
  id: string
): Promise<{ errors: string[] } | { error: string }> {
  if (!uuidSchema.safeParse(id).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { data, error } = await admin.from('sync_logs').select('errors').eq('id', id).single()

  if (error) return { error: 'errors.serverError' }

  const errors = Array.isArray(data?.errors) ? (data.errors as string[]) : []
  return { errors }
}
