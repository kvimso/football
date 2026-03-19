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
    supabase.from('players').select('name, position').eq('slug', params.p1).single(),
    supabase.from('players').select('name, position').eq('slug', params.p2).single(),
  ])

  const title =
    p1 && p2
      ? `${p1.name} vs ${p2.name} | Compare Players`
      : 'Compare Players | Georgian Football Talent Platform'

  const description =
    p1 && p2
      ? `Head-to-head comparison of ${p1.name} (${p1.position}) and ${p2.name} (${p2.position}). Skills, stats, and career data.`
      : 'Side-by-side comparison of Georgian youth football players.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website' as const,
      siteName: 'Georgian Football Talent Platform',
    },
    twitter: { card: 'summary' as const, title, description },
  }
}

async function fetchPlayer(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data, error } = await supabase
    .from('players')
    .select(
      `
      name, name_ka, slug, position, date_of_birth, height_cm, weight_kg,
      preferred_foot, jersey_number,
      club:clubs!players_club_id_fkey ( name, name_ka ),
      skills:player_skills ( overall, attack, defence, fitness, dribbling, shooting, possession, tackling, positioning, matches_counted )
    `
    )
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Failed to fetch player ${slug}:`, error.message)
    return null
  }

  // Cast through unknown because skills uses new columns not yet in database.types.ts
  type RawPlayerData = typeof data & {
    skills: {
      overall: number | null
      attack: number | null
      defence: number | null
      fitness: number | null
      dribbling: number | null
      shooting: number | null
      possession: number | null
      tackling: number | null
      positioning: number | null
      matches_counted: number | null
    } | null
  }
  const raw = data as unknown as RawPlayerData

  return {
    ...raw,
    position: raw.position as Position,
    club: unwrapRelation(raw.club),
    skills: unwrapRelation(raw.skills),
  }
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch full data for selected players only (dropdown uses async search API)
  const [player1, player2] = await Promise.all([
    params.p1 ? fetchPlayer(supabase, params.p1) : null,
    params.p2 ? fetchPlayer(supabase, params.p2) : null,
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <CompareView
        player1={player1}
        player2={player2}
        selectedP1={params.p1 ?? ''}
        selectedP2={params.p2 ?? ''}
      />
    </div>
  )
}
