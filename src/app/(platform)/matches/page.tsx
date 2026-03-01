import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { MatchCard } from '@/components/match/MatchCard'
import { MatchFilters } from '@/components/match/MatchFilters'

export const metadata: Metadata = {
  title: 'Match Library | Georgian Football Talent Platform',
  description: 'Browse match results and player performances from Georgian youth football.',
}

interface MatchesPageProps {
  searchParams: Promise<{ competition?: string }>
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { t } = await getServerT()

  // Query 1: Get distinct competition names for the filter dropdown
  const { data: allMatches, error: compError } = await supabase
    .from('matches')
    .select('competition')

  if (compError) console.error('Failed to fetch competitions:', compError.message)

  const competitions = [...new Set((allMatches ?? []).map((m) => m.competition).filter(Boolean))] as string[]

  // Query 2: Fetch filtered matches
  let query = supabase
    .from('matches')
    .select(`
      slug, home_score, away_score, competition, match_date,
      home_club:clubs!matches_home_club_id_fkey ( name, name_ka ),
      away_club:clubs!matches_away_club_id_fkey ( name, name_ka )
    `)
    .order('match_date', { ascending: false })
    .limit(200)

  if (params.competition) {
    query = query.eq('competition', params.competition)
  }

  const { data: matches, error: matchesError } = await query

  if (matchesError) console.error('Failed to fetch matches:', matchesError.message)

  const matchCards = (matches ?? []).map((m) => ({
    ...m,
    home_club: unwrapRelation(m.home_club),
    away_club: unwrapRelation(m.away_club),
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('matches.title')}</h1>
        <p className="mt-1 text-foreground-muted">
          {t('matches.subtitle')}
        </p>
      </div>

      <MatchFilters competitions={competitions} />

      <p className="mt-6 mb-4 text-sm text-foreground-muted">
        {matchCards.length} {matchCards.length !== 1 ? t('matches.matchPlural') : t('matches.match')} {t('common.found')}
      </p>

      {matchCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matchCards.map((match) => (
            <MatchCard key={match.slug} match={match} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-foreground-muted/30 mb-4">&#9917;</div>
          <p className="text-lg font-medium text-foreground-muted">{t('matches.noMatches')}</p>
        </div>
      )}
    </div>
  )
}
