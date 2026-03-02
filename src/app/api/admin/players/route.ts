import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { playerFormSchema, platformPlayerFormSchema, uuidSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'
import { recordClubJoin, recordClubDeparture } from '@/lib/transfer-helpers'

// POST /api/admin/players — Create a new player
// Academy admin: creates in own club. Platform admin: creates in any club.
export async function POST(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { profile } = auth

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  if (profile.role === 'platform_admin') {
    return handlePlatformCreate(body)
  }

  if (profile.role === 'academy_admin' && profile.club_id) {
    return handleAdminCreate(supabase, body, profile.club_id)
  }

  return apiError('errors.unauthorized', 403)
}

// PUT /api/admin/players — Update an existing player
// Academy admin: own club only. Platform admin: any player.
export async function PUT(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { profile } = auth

  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('id')
  if (!playerId || !uuidSchema.safeParse(playerId).success) {
    return apiError('errors.invalidInput', 400)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  if (profile.role === 'platform_admin') {
    return handlePlatformUpdate(playerId, body)
  }

  if (profile.role === 'academy_admin' && profile.club_id) {
    return handleAdminUpdate(supabase, playerId, body, profile.club_id)
  }

  return apiError('errors.unauthorized', 403)
}

async function handleAdminCreate(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  body: unknown,
  clubId: string,
) {
  const parsed = playerFormSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'errors.invalidInput', 400)

  const name = `${parsed.data.first_name} ${parsed.data.last_name}`
  const name_ka = `${parsed.data.first_name_ka} ${parsed.data.last_name_ka}`
  const slug = generateSlug(name)

  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

  const { data: newPlayer, error: insertError } = await supabase
    .from('players')
    .insert({
      name, name_ka, club_id: clubId, slug: finalSlug,
      date_of_birth: parsed.data.date_of_birth,
      position: parsed.data.position,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      parent_guardian_contact: parsed.data.parent_guardian_contact ?? null,
      status: 'active',
    })
    .select('id, slug')
    .single()

  if (insertError) {
    console.error('[api/admin/players] Create error:', insertError.message)
    return apiError('errors.serverError', 500)
  }

  if (newPlayer) await recordClubJoin(supabase, newPlayer.id, clubId)

  return apiSuccess({ id: newPlayer?.id, slug: finalSlug }, undefined)
}

async function handleAdminUpdate(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  playerId: string,
  body: unknown,
  clubId: string,
) {
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id, club_id')
    .eq('id', playerId)
    .single()

  if (!existingPlayer) return apiError('errors.playerNotFound', 404)
  if (existingPlayer.club_id !== clubId) return apiError('errors.unauthorized', 403)

  const parsed = playerFormSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'errors.invalidInput', 400)

  const name = `${parsed.data.first_name} ${parsed.data.last_name}`
  const name_ka = `${parsed.data.first_name_ka} ${parsed.data.last_name_ka}`

  const { error: updateError } = await supabase
    .from('players')
    .update({
      name, name_ka,
      date_of_birth: parsed.data.date_of_birth,
      position: parsed.data.position,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      parent_guardian_contact: parsed.data.parent_guardian_contact ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', playerId)

  if (updateError) {
    console.error('[api/admin/players] Update error:', updateError.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess({ id: playerId }, undefined)
}

async function handlePlatformCreate(body: unknown) {
  const parsed = platformPlayerFormSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'errors.invalidInput', 400)

  const admin = createAdminClient()
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
      name, name_ka, club_id: clubId, slug: finalSlug,
      date_of_birth: parsed.data.date_of_birth,
      position: parsed.data.position,
      preferred_foot: parsed.data.preferred_foot ?? null,
      height_cm: parsed.data.height_cm ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      parent_guardian_contact: parsed.data.parent_guardian_contact ?? null,
      status,
    })
    .select('id, slug')
    .single()

  if (insertError) {
    console.error('[api/admin/players] Platform create error:', insertError.message)
    return apiError('errors.serverError', 500)
  }

  if (newPlayer && clubId) await recordClubJoin(admin, newPlayer.id, clubId)

  return apiSuccess({ id: newPlayer?.id, slug: finalSlug }, undefined)
}

async function handlePlatformUpdate(playerId: string, body: unknown) {
  const parsed = platformPlayerFormSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'errors.invalidInput', 400)

  const admin = createAdminClient()

  const { data: currentPlayer } = await admin
    .from('players')
    .select('id, club_id, status')
    .eq('id', playerId)
    .single()

  if (!currentPlayer) return apiError('errors.playerNotFound', 404)

  const name = `${parsed.data.first_name} ${parsed.data.last_name}`
  const name_ka = `${parsed.data.first_name_ka} ${parsed.data.last_name_ka}`
  const newClubId = parsed.data.club_id || null
  const newStatus = newClubId ? (parsed.data.status ?? 'active') : 'free_agent'

  const { error: updateError } = await admin
    .from('players')
    .update({
      name, name_ka, club_id: newClubId,
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

  if (updateError) {
    console.error('[api/admin/players] Platform update error:', updateError.message)
    return apiError('errors.serverError', 500)
  }

  // Handle club change
  if (currentPlayer.club_id !== newClubId) {
    if (currentPlayer.club_id) await recordClubDeparture(admin, playerId, currentPlayer.club_id)
    if (newClubId) await recordClubJoin(admin, playerId, newClubId)
  }

  return apiSuccess({ id: playerId }, undefined)
}
