import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest, parseIntParam } from '@/lib/api-utils'
import { unwrapRelation } from '@/lib/utils'

// GET /api/matches — Match listing with filters
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const { error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  const { searchParams } = new URL(request.url)
  const competition = searchParams.get('competition')
  const club = searchParams.get('club')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const limit = parseIntParam(searchParams.get('limit'), 100, 1, 200)

  let query = supabase
    .from('matches')
    .select(`
      id, slug, home_score, away_score, competition, match_date, venue,
      home_club:clubs!matches_home_club_id_fkey ( id, name, name_ka, slug ),
      away_club:clubs!matches_away_club_id_fkey ( id, name, name_ka, slug )
    `)
    .order('match_date', { ascending: false })
    .limit(limit)

  if (competition) query = query.eq('competition', competition)

  if (club) {
    query = query.or(`home_club_id.eq.${club},away_club_id.eq.${club}`)
  }

  if (dateFrom) query = query.gte('match_date', dateFrom)
  if (dateTo) query = query.lte('match_date', dateTo)

  const { data: matches, error } = await query

  if (error) {
    console.error('[api/matches] Query error:', error.message)
    return apiError('errors.serverError', 500)
  }

  const results = (matches ?? []).map((m) => ({
    ...m,
    home_club: unwrapRelation(m.home_club),
    away_club: unwrapRelation(m.away_club),
  }))

  // Get distinct competitions for filter metadata
  const competitions = [...new Set(results.map((m) => m.competition).filter(Boolean))]

  return apiSuccess(results, { total: results.length, competitions })
}
