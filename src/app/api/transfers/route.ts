import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { uuidSchema } from '@/lib/validations'
import { unwrapRelation } from '@/lib/utils'
import { recordClubJoin } from '@/lib/transfer-helpers'
import { z } from 'zod'

const createTransferSchema = z.object({
  player_id: uuidSchema,
})

const claimFreeAgentSchema = z.object({
  player_id: uuidSchema,
  action: z.literal('claim'),
})

// GET /api/transfers — List transfer requests for the current user's club
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { profile, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  if (profile!.role !== 'academy_admin' || !profile!.club_id) {
    return apiError('errors.unauthorized', 403)
  }

  const { searchParams } = new URL(request.url)
  const direction = searchParams.get('direction') // 'incoming' | 'outgoing' | null (both)
  const statusFilter = searchParams.get('status')

  let query = supabase
    .from('transfer_requests')
    .select(`
      id, status, requested_at, resolved_at, expires_at,
      player:players!transfer_requests_player_id_fkey ( id, name, name_ka, slug, position ),
      from_club:clubs!transfer_requests_from_club_id_fkey ( id, name, name_ka ),
      to_club:clubs!transfer_requests_to_club_id_fkey ( id, name, name_ka )
    `)
    .order('requested_at', { ascending: false })

  if (direction === 'incoming') {
    query = query.eq('from_club_id', profile!.club_id)
  } else if (direction === 'outgoing') {
    query = query.eq('to_club_id', profile!.club_id)
  } else {
    query = query.or(`from_club_id.eq.${profile!.club_id},to_club_id.eq.${profile!.club_id}`)
  }

  const validStatuses = ['pending', 'accepted', 'declined', 'expired'] as const
  if (statusFilter && validStatuses.includes(statusFilter as typeof validStatuses[number])) {
    query = query.eq('status', statusFilter as typeof validStatuses[number])
  }

  const { data, error } = await query
  if (error) {
    console.error('[api/transfers] Query error:', error.message)
    return apiError('errors.serverError', 500)
  }

  const results = (data ?? []).map((t) => ({
    id: t.id,
    status: t.status,
    requested_at: t.requested_at,
    resolved_at: t.resolved_at,
    expires_at: t.expires_at,
    player: unwrapRelation(t.player),
    from_club: unwrapRelation(t.from_club),
    to_club: unwrapRelation(t.to_club),
  }))

  return apiSuccess(results, { total: results.length })
}

// POST /api/transfers — Create a transfer request or claim a free agent
export async function POST(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { profile, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  if (profile!.role !== 'academy_admin' || !profile!.club_id) {
    return apiError('errors.unauthorized', 403)
  }

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  // Check if this is a free agent claim
  const claimParsed = claimFreeAgentSchema.safeParse(body)
  if (claimParsed.success) {
    return handleClaimFreeAgent(supabase, claimParsed.data.player_id, profile!.club_id!)
  }

  // Otherwise it's a standard transfer request
  const parsed = createTransferSchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, club_id, name')
    .eq('id', parsed.data.player_id)
    .single()

  if (playerError || !player) return apiError('errors.playerNotFound', 404)
  if (!player.club_id) return apiError('errors.playerNotFoundOrFreeAgent', 400)
  if (player.club_id === profile!.club_id) return apiError('errors.playerAlreadyAtClub', 400)

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('transfer_requests')
    .select('id')
    .eq('player_id', parsed.data.player_id)
    .eq('to_club_id', profile!.club_id!)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return apiError('errors.transferAlreadyPending', 409)

  const { data: newRequest, error: insertError } = await supabase
    .from('transfer_requests')
    .insert({
      player_id: parsed.data.player_id,
      from_club_id: player.club_id,
      to_club_id: profile!.club_id!,
    })
    .select('id, status, requested_at')
    .single()

  if (insertError) {
    console.error('[api/transfers] Insert error:', insertError.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess(newRequest, undefined)
}

async function handleClaimFreeAgent(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  playerId: string,
  clubId: string,
) {
  const { data: player } = await supabase
    .from('players')
    .select('id, club_id, status, name')
    .eq('id', playerId)
    .single()

  if (!player) return apiError('errors.playerNotFound', 404)
  if (player.club_id !== null || player.status !== 'free_agent') {
    return apiError('errors.playerNotFreeAgent', 400)
  }

  const admin = createAdminClient()

  const { error: updateErr, data: updated } = await admin
    .from('players')
    .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
    .eq('id', playerId)
    .is('club_id', null)
    .eq('status', 'free_agent')
    .select('id')

  if (updateErr) {
    console.error('[api/transfers] Claim error:', updateErr.message)
    return apiError('errors.serverError', 500)
  }
  if (!updated || updated.length === 0) return apiError('errors.playerNoLongerFreeAgent', 409)

  await recordClubJoin(admin, playerId, clubId)

  return apiSuccess({ player_id: playerId, player_name: player.name }, undefined)
}
