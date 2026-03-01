import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { calculateAge, unwrapRelation } from '@/lib/utils'
import { uuidSchema } from '@/lib/validations'

// GET /api/players/[id] — Full player profile with stats
// Accepts UUID (id) or slug string
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createApiClient(request)
  const { error: authResponse } = await authenticateRequest(supabase)
  if (authResponse) return authResponse

  // Determine whether the param is a UUID or slug
  const isUuid = uuidSchema.safeParse(id).success
  const filterColumn = isUuid ? 'id' : 'slug'

  const { data: player, error } = await supabase
    .from('players')
    .select(`
      id, name, name_ka, slug, date_of_birth, nationality, position,
      preferred_foot, height_cm, weight_kg, photo_url, jersey_number,
      scouting_report, scouting_report_ka, status, is_featured, platform_id,
      club:clubs!players_club_id_fkey ( id, name, name_ka, slug ),
      skills:player_skills ( pace, shooting, passing, dribbling, defending, physical ),
      season_stats:player_season_stats ( season, matches_played, goals, assists, minutes_played, pass_accuracy, shots_on_target, tackles, interceptions, clean_sheets, distance_covered_km, sprints ),
      match_stats:match_player_stats (
        minutes_played, goals, assists, pass_accuracy, shots, shots_on_target,
        tackles, interceptions, distance_km, sprints, top_speed_kmh, rating,
        match:matches!match_player_stats_match_id_fkey (
          slug, match_date, competition,
          home_club:clubs!matches_home_club_id_fkey ( name, name_ka ),
          away_club:clubs!matches_away_club_id_fkey ( name, name_ka )
        )
      ),
      club_history:player_club_history (
        id, joined_at, left_at,
        club:clubs!player_club_history_club_id_fkey ( name, name_ka, slug )
      )
    `)
    .eq(filterColumn, id)
    .single()

  if (error || !player) {
    return apiError('errors.playerNotFound', 404)
  }

  const club = unwrapRelation(player.club)
  const skills = unwrapRelation(player.skills)
  const seasonStats = Array.isArray(player.season_stats)
    ? player.season_stats
    : player.season_stats ? [player.season_stats] : []
  const matchStats = (Array.isArray(player.match_stats) ? player.match_stats : []).map((ms) => ({
    ...ms,
    match: unwrapRelation(ms.match),
  }))
  const clubHistory = (Array.isArray(player.club_history) ? player.club_history : [])
    .map((h) => ({ ...h, club: unwrapRelation(h.club) }))
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())

  // Fetch view counts
  let totalViews = 0
  let weeklyViews = 0
  try {
    const { data: viewCounts } = await supabase.rpc('get_player_view_counts', {
      player_ids: [player.id],
    })
    if (viewCounts?.[0]) {
      totalViews = Number(viewCounts[0].total_views)
      weeklyViews = Number(viewCounts[0].weekly_views)
    }
  } catch {
    // Non-critical
  }

  // Build similar players
  const dob = new Date(player.date_of_birth)
  const dobMinus2 = new Date(dob)
  dobMinus2.setFullYear(dob.getFullYear() - 2)
  const dobPlus2 = new Date(dob)
  dobPlus2.setFullYear(dob.getFullYear() + 2)

  const { data: rawSimilar } = await supabase
    .from('players')
    .select(`
      id, slug, name, name_ka, position, date_of_birth, photo_url, status,
      club:clubs!players_club_id_fkey ( name, name_ka )
    `)
    .eq('position', player.position)
    .neq('id', player.id)
    .in('status', ['active', 'free_agent'])
    .gte('date_of_birth', dobMinus2.toISOString().split('T')[0])
    .lte('date_of_birth', dobPlus2.toISOString().split('T')[0])
    .limit(4)

  const similarPlayers = (rawSimilar ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    name_ka: p.name_ka,
    position: p.position,
    date_of_birth: p.date_of_birth,
    photo_url: p.photo_url,
    status: p.status,
    club: unwrapRelation(p.club),
  }))

  return apiSuccess({
    id: player.id,
    slug: player.slug,
    name: player.name,
    name_ka: player.name_ka,
    platform_id: player.platform_id,
    date_of_birth: player.date_of_birth,
    age: calculateAge(player.date_of_birth),
    nationality: player.nationality,
    position: player.position,
    preferred_foot: player.preferred_foot,
    height_cm: player.height_cm,
    weight_kg: player.weight_kg,
    photo_url: player.photo_url,
    jersey_number: player.jersey_number,
    scouting_report: player.scouting_report,
    scouting_report_ka: player.scouting_report_ka,
    status: player.status,
    is_featured: player.is_featured,
    club,
    skills,
    season_stats: seasonStats,
    match_stats: matchStats,
    club_history: clubHistory,
    views: { total: totalViews, weekly: weeklyViews },
    similar_players: similarPlayers,
  })
}
