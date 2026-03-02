import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { unwrapRelation } from '@/lib/utils'

// GET /api/matches/[slug] — Match detail with player stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, slug, home_score, away_score, competition, match_date, venue,
      video_url, highlights_url, match_report, match_report_ka,
      home_club:clubs!matches_home_club_id_fkey ( id, name, name_ka, slug ),
      away_club:clubs!matches_away_club_id_fkey ( id, name, name_ka, slug ),
      player_stats:match_player_stats (
        minutes_played, goals, assists, pass_accuracy, shots, shots_on_target,
        tackles, interceptions, distance_km, sprints, top_speed_kmh, rating,
        player:players!match_player_stats_player_id_fkey ( id, name, name_ka, slug, position, club_id )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !match) {
    return apiError('errors.matchNotFound', 404)
  }

  const playerStats = (Array.isArray(match.player_stats) ? match.player_stats : []).map((ps) => ({
    ...ps,
    player: unwrapRelation(ps.player),
  }))

  return apiSuccess({
    id: match.id,
    slug: match.slug,
    home_score: match.home_score,
    away_score: match.away_score,
    competition: match.competition,
    match_date: match.match_date,
    venue: match.venue,
    video_url: match.video_url,
    highlights_url: match.highlights_url,
    match_report: match.match_report,
    match_report_ka: match.match_report_ka,
    home_club: unwrapRelation(match.home_club),
    away_club: unwrapRelation(match.away_club),
    player_stats: playerStats,
  })
}
