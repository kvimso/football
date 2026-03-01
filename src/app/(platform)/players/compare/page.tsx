import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import type { Position } from '@/lib/types'
import { CompareView } from '@/components/player/CompareView'

interface ComparePageProps {
  searchParams: Promise<{ p1?: string; p2?: string }>
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams
  if (!params.p1 || !params.p2) {
    return {
      title: 'Compare Players | Georgian Football Talent Platform',
      description: 'Side-by-side comparison of Georgian youth football players.',
    }
  }

  const supabase = await createClient()
  const [{ data: p1 }, { data: p2 }] = await Promise.all([
    supabase.from('players').select('name').eq('slug', params.p1).single(),
    supabase.from('players').select('name').eq('slug', params.p2).single(),
  ])

  const title = p1 && p2
    ? `${p1.name} vs ${p2.name} | Compare Players`
    : 'Compare Players | Georgian Football Talent Platform'

  return {
    title,
    description: 'Side-by-side comparison of Georgian youth football players.',
  }
}

async function fetchPlayer(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data, error } = await supabase
    .from('players')
    .select(`
      name, name_ka, slug, position, date_of_birth, height_cm, weight_kg,
      preferred_foot, jersey_number,
      club:clubs!players_club_id_fkey ( name, name_ka ),
      skills:player_skills ( pace, shooting, passing, dribbling, defending, physical ),
      season_stats:player_season_stats ( season, matches_played, goals, assists, minutes_played, pass_accuracy, tackles, interceptions )
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Failed to fetch player ${slug}:`, error.message)
    return null
  }

  return {
    ...data,
    position: data.position as Position,
    club: unwrapRelation(data.club),
    skills: unwrapRelation(data.skills),
    season_stats: unwrapRelation(data.season_stats),
  }
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch all active players for the selector
  const { data: allPlayers, error: apError } = await supabase
    .from('players')
    .select('slug, name, name_ka, position')
    .in('status', ['active', 'free_agent'])
    .order('name')

  if (apError) console.error('Failed to fetch players list:', apError.message)

  // Fetch full data for selected players in parallel
  const [player1, player2] = await Promise.all([
    params.p1 ? fetchPlayer(supabase, params.p1) : null,
    params.p2 ? fetchPlayer(supabase, params.p2) : null,
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CompareView
        allPlayers={(allPlayers ?? []).map(p => ({ ...p, position: p.position as Position }))}
        player1={player1}
        player2={player2}
        selectedP1={params.p1 ?? ''}
        selectedP2={params.p2 ?? ''}
      />
    </div>
  )
}
