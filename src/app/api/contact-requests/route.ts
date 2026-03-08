import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { uuidSchema, responseMessageSchema } from '@/lib/validations'
import { z } from 'zod'

const createRequestSchema = z.object({
  player_id: uuidSchema,
  message: z.string().min(1).max(2000),
})

const updateRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  response_message: responseMessageSchema,
})

// GET /api/contact-requests — List contact requests for the current user
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { user, profile } = auth

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  if (profile.role === 'scout') {
    // Scouts see their own sent requests
    let query = supabase
      .from('contact_requests')
      .select(`
        id, message, status, response_message, created_at, responded_at,
        player:players!contact_requests_player_id_fkey ( id, name, name_ka, slug, position )
      `)
      .eq('scout_id', user.id)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (error) {
      console.error('[api/contact-requests] Query error:', error.message)
      return apiError('errors.serverError', 500)
    }
    return apiSuccess(data, { total: data?.length ?? 0 })
  }

  if (profile.role === 'academy_admin' && profile.club_id) {
    // Academy admins see requests for their club's players
    let query = supabase
      .from('contact_requests')
      .select(`
        id, message, status, response_message, created_at, responded_at,
        player:players!contact_requests_player_id_fkey ( id, name, name_ka, slug, position ),
        scout:profiles!contact_requests_scout_id_fkey ( id, full_name )
      `)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (error) {
      console.error('[api/contact-requests] Query error:', error.message)
      return apiError('errors.serverError', 500)
    }
    return apiSuccess(data, { total: data?.length ?? 0 })
  }

  return apiError('errors.unauthorized', 403)
}

// POST /api/contact-requests — Scout sends a contact request for a player
export async function POST(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { user, profile } = auth

  if (profile.role !== 'scout') {
    return apiError('errors.unauthorized', 403)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  const parsed = createRequestSchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  // Verify player exists and is active (not free agent)
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, status, club_id')
    .eq('id', parsed.data.player_id)
    .single()

  if (playerError || !player) return apiError('errors.playerNotFound', 404)
  if (player.status === 'free_agent') return apiError('errors.contactNotAvailableForFreeAgent', 400)
  if (!player.club_id) return apiError('errors.contactNotAvailableForFreeAgent', 400)

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('contact_requests')
    .select('id')
    .eq('scout_id', user.id)
    .eq('player_id', parsed.data.player_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return apiError('errors.requestAlreadyPending', 409)

  const { data: newRequest, error: insertError } = await supabase
    .from('contact_requests')
    .insert({
      scout_id: user.id,
      player_id: parsed.data.player_id,
      message: parsed.data.message,
    })
    .select('id, status, created_at')
    .single()

  if (insertError) {
    console.error('[api/contact-requests] Insert error:', insertError.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess(newRequest, undefined)
}

// PATCH /api/contact-requests — Academy admin responds to a request
export async function PATCH(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { user, profile } = auth

  if (profile.role !== 'academy_admin') {
    return apiError('errors.unauthorized', 403)
  }

  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('id')
  if (!requestId || !uuidSchema.safeParse(requestId).success) {
    return apiError('errors.invalidInput', 400)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  const parsed = updateRequestSchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  // Ownership check: verify the contact request is for a player at the admin's club
  const { data: existingRequest } = await supabase
    .from('contact_requests')
    .select('id, player:players!contact_requests_player_id_fkey(club_id)')
    .eq('id', requestId)
    .single()

  if (!existingRequest) return apiError('errors.requestNotFound', 404)

  const playerClubId = (existingRequest.player as { club_id: string | null } | null)?.club_id
  if (playerClubId !== profile.club_id) {
    return apiError('errors.unauthorized', 403)
  }

  const { error: updateError } = await supabase
    .from('contact_requests')
    .update({
      status: parsed.data.status,
      response_message: parsed.data.response_message?.trim() || null,
      responded_at: new Date().toISOString(),
      responded_by: user.id,
    })
    .eq('id', requestId)

  if (updateError) {
    console.error('[api/contact-requests] Update error:', updateError.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess({ id: requestId, status: parsed.data.status }, undefined)
}
