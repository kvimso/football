import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { uuidSchema } from '@/lib/validations'
import { unwrapRelation } from '@/lib/utils'
import { z } from 'zod'

const shortlistBodySchema = z.object({
  player_id: uuidSchema,
})

const updateNotesSchema = z.object({
  player_id: uuidSchema,
  notes: z.string().max(2000),
})

// GET /api/shortlist — List the current user's shortlisted players
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { user, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  const { data: shortlist, error } = await supabase
    .from('shortlists')
    .select(`
      id, notes, created_at,
      player:players!shortlists_player_id_fkey (
        id, slug, name, name_ka, position, date_of_birth, height_cm,
        preferred_foot, photo_url, status, platform_id,
        club:clubs!players_club_id_fkey ( name, name_ka, slug ),
        season_stats:player_season_stats ( season, goals, assists, matches_played )
      )
    `)
    .eq('scout_id', user!.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/shortlist] Query error:', error.message)
    return apiError('errors.serverError', 500)
  }

  const items = (shortlist ?? []).map((s) => {
    const player = unwrapRelation(s.player)
    let latestStats = null
    if (player) {
      const statsArr = Array.isArray(player.season_stats) ? player.season_stats : player.season_stats ? [player.season_stats] : []
      latestStats = statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null
    }
    return {
      id: s.id,
      notes: s.notes,
      created_at: s.created_at,
      player: player ? {
        ...player,
        club: unwrapRelation(player.club),
        season_stats: undefined,
        latest_season_stats: latestStats,
      } : null,
    }
  })

  return apiSuccess(items, { total: items.length })
}

// POST /api/shortlist — Add a player to shortlist
export async function POST(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { user, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  const parsed = shortlistBodySchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  const { error } = await supabase
    .from('shortlists')
    .insert({ scout_id: user!.id, player_id: parsed.data.player_id })

  if (error) {
    if (error.code === '23505') return apiError('errors.alreadyShortlisted', 409)
    console.error('[api/shortlist] Insert error:', error.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess({ player_id: parsed.data.player_id }, undefined)
}

// DELETE /api/shortlist — Remove a player from shortlist
export async function DELETE(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { user, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('player_id')
  if (!playerId || !uuidSchema.safeParse(playerId).success) {
    return apiError('errors.invalidInput', 400)
  }

  const { error } = await supabase
    .from('shortlists')
    .delete()
    .eq('scout_id', user!.id)
    .eq('player_id', playerId)

  if (error) {
    console.error('[api/shortlist] Delete error:', error.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess({ player_id: playerId }, undefined)
}

// PATCH /api/shortlist — Update notes on a shortlisted player
export async function PATCH(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { user, error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  let body: unknown
  try { body = await request.json() } catch {
    return apiError('errors.invalidInput', 400)
  }

  const parsed = updateNotesSchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  const { error } = await supabase
    .from('shortlists')
    .update({ notes: parsed.data.notes })
    .eq('scout_id', user!.id)
    .eq('player_id', parsed.data.player_id)

  if (error) {
    console.error('[api/shortlist] Update error:', error.message)
    return apiError('errors.serverError', 500)
  }

  return apiSuccess({ player_id: parsed.data.player_id, notes: parsed.data.notes }, undefined)
}
