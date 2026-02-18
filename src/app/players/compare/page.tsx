import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CompareView } from '@/components/player/CompareView'

export const metadata: Metadata = {
  title: 'Compare Players | Georgian Football Talent Platform',
  description: 'Side-by-side comparison of Georgian youth football players.',
}

interface ComparePageProps {
  searchParams: Promise<{ p1?: string; p2?: string }>
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all active players for the selector
  const { data: allPlayers, error: apError } = await supabase
    .from('players')
    .select('slug, name, name_ka, position')
    .eq('status', 'active')
    .order('name')

  if (apError) console.error('Failed to fetch players list:', apError.message)

  // Fetch full data for selected players
  let player1 = null
  let player2 = null

  if (params.p1) {
    const { data, error } = await supabase
      .from('players')
      .select(`
        name, name_ka, slug, position, date_of_birth, height_cm, weight_kg,
        preferred_foot, jersey_number,
        club:clubs!players_club_id_fkey ( name, name_ka ),
        skills:player_skills ( pace, shooting, passing, dribbling, defending, physical ),
        season_stats:player_season_stats ( season, matches_played, goals, assists, minutes_played, pass_accuracy, tackles, interceptions )
      `)
      .eq('slug', params.p1)
      .single()

    if (error) console.error('Failed to fetch player 1:', error.message)

    if (data) {
      player1 = {
        ...data,
        club: Array.isArray(data.club) ? data.club[0] : data.club,
        skills: Array.isArray(data.skills) ? data.skills[0] : data.skills,
        season_stats: Array.isArray(data.season_stats) ? data.season_stats[0] : data.season_stats,
      }
    }
  }

  if (params.p2) {
    const { data, error } = await supabase
      .from('players')
      .select(`
        name, name_ka, slug, position, date_of_birth, height_cm, weight_kg,
        preferred_foot, jersey_number,
        club:clubs!players_club_id_fkey ( name, name_ka ),
        skills:player_skills ( pace, shooting, passing, dribbling, defending, physical ),
        season_stats:player_season_stats ( season, matches_played, goals, assists, minutes_played, pass_accuracy, tackles, interceptions )
      `)
      .eq('slug', params.p2)
      .single()

    if (error) console.error('Failed to fetch player 2:', error.message)

    if (data) {
      player2 = {
        ...data,
        club: Array.isArray(data.club) ? data.club[0] : data.club,
        skills: Array.isArray(data.skills) ? data.skills[0] : data.skills,
        season_stats: Array.isArray(data.season_stats) ? data.season_stats[0] : data.season_stats,
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CompareView
        allPlayers={allPlayers ?? []}
        player1={player1}
        player2={player2}
        selectedP1={params.p1 ?? ''}
        selectedP2={params.p2 ?? ''}
      />
    </div>
  )
}
