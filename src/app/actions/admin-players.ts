'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { playerFormSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'

async function getAdminClubId() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', clubId: null, supabase: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found', clubId: null, supabase: null }
  if (profile.role !== 'academy_admin' && profile.role !== 'platform_admin') {
    return { error: 'Unauthorized', clubId: null, supabase: null }
  }

  return { error: null, clubId: profile.club_id as string, supabase }
}

export async function createPlayer(data: Record<string, unknown>) {
  const { error: authErr, clubId, supabase } = await getAdminClubId()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const parsed = playerFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const slug = generateSlug(parsed.data.name)

  // Check for duplicate slug
  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const { error: insertError } = await supabase
    .from('players')
    .insert({
      ...parsed.data,
      club_id: clubId,
      slug: finalSlug,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      jersey_number: parsed.data.jersey_number ?? null,
      scouting_report: parsed.data.scouting_report ?? null,
      scouting_report_ka: parsed.data.scouting_report_ka ?? null,
    })

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true, slug: finalSlug }
}

export async function updatePlayer(
  playerId: string,
  data: Record<string, unknown>
) {
  const { error: authErr, clubId, supabase } = await getAdminClubId()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  // Verify player belongs to admin's club
  const { data: existingPlayer, error: checkError } = await supabase
    .from('players')
    .select('id, club_id')
    .eq('id', playerId)
    .single()

  if (checkError || !existingPlayer) return { error: 'Player not found' }
  if (existingPlayer.club_id !== clubId) return { error: 'Unauthorized' }

  const parsed = playerFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  const { error: updateError } = await supabase
    .from('players')
    .update({
      ...parsed.data,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      jersey_number: parsed.data.jersey_number ?? null,
      scouting_report: parsed.data.scouting_report ?? null,
      scouting_report_ka: parsed.data.scouting_report_ka ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true }
}

export async function deactivatePlayer(playerId: string) {
  const { error: authErr, clubId, supabase } = await getAdminClubId()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('club_id')
    .eq('id', playerId)
    .single()

  if (!player || player.club_id !== clubId) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('players')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', playerId)

  if (error) return { error: error.message }

  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true }
}

export async function reactivatePlayer(playerId: string) {
  const { error: authErr, clubId, supabase } = await getAdminClubId()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('club_id')
    .eq('id', playerId)
    .single()

  if (!player || player.club_id !== clubId) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('players')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', playerId)

  if (error) return { error: error.message }

  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true }
}
