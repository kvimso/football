import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { PlayerCard } from '@/components/player/PlayerCard'
import { MatchCard } from '@/components/match/MatchCard'
import { HomeHero } from '@/components/home/HomeHero'
import { StatsBar } from '@/components/home/StatsBar'

export default async function Home() {
  let debugInfo = ''

  try {
    // Step 1: Check env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    debugInfo += `ENV: URL=${url ? 'SET' : 'MISSING'}, KEY=${key ? 'SET' : 'MISSING'}. `

    // Step 2: Create client
    const supabase = await createClient()
    debugInfo += 'Client created. '

    // Step 3: Get translations
    const { t } = await getServerT()
    debugInfo += 'Translations loaded. '

    // Step 4: Fetch data
    const [
      { data: featuredPlayers, error: fpError },
      { data: recentMatches, error: rmError },
      { count: playerCount, error: pcError },
      { count: clubCount, error: ccError },
      { count: matchCount, error: mcError },
    ] = await Promise.all([
      supabase
        .from('players')
        .select(`
          slug, name, name_ka, position, date_of_birth, height_cm,
          preferred_foot, is_featured, photo_url, status,
          club:clubs!players_club_id_fkey ( name, name_ka ),
          season_stats:player_season_stats ( season, goals, assists, matches_played )
        `)
        .eq('is_featured', true)
        .eq('status', 'active')
        .limit(4),
      supabase
        .from('matches')
        .select(`
          slug, home_score, away_score, competition, match_date,
          home_club:clubs!matches_home_club_id_fkey ( name, name_ka ),
          away_club:clubs!matches_away_club_id_fkey ( name, name_ka )
        `)
        .order('match_date', { ascending: false })
        .limit(5),
      supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('clubs')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('matches')
        .select('*', { count: 'exact', head: true }),
    ])

    debugInfo += `Queries done. FP=${featuredPlayers?.length ?? 'null'}(${fpError?.message ?? 'ok'}), RM=${recentMatches?.length ?? 'null'}(${rmError?.message ?? 'ok'}), PC=${playerCount ?? 'null'}, CC=${clubCount ?? 'null'}, MC=${matchCount ?? 'null'}. `

    const playerCards = (featuredPlayers ?? []).map((p) => {
      const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
      return {
        ...p,
        club: Array.isArray(p.club) ? p.club[0] : p.club,
        season_stats: statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null,
        status: p.status ?? 'active',
      }
    })

    const matchCards = (recentMatches ?? []).map((m) => ({
      ...m,
      home_club: Array.isArray(m.home_club) ? m.home_club[0] : m.home_club,
      away_club: Array.isArray(m.away_club) ? m.away_club[0] : m.away_club,
    }))

    return (
      <div>
        <HomeHero />

        <StatsBar
          players={playerCount ?? 0}
          clubs={clubCount ?? 0}
          matches={matchCount ?? 0}
        />

        {/* Featured Players */}
        {playerCards.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{t('home.featuredPlayers')}</h2>
              <Link href="/players" className="btn-secondary text-sm">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {playerCards.map((player) => (
                <PlayerCard key={player.slug} player={player} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Matches */}
        {matchCards.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{t('home.recentMatches')}</h2>
              <Link href="/matches" className="btn-secondary text-sm">
                {t('common.viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matchCards.map((match) => (
                <MatchCard key={match.slug} match={match} />
              ))}
            </div>
          </section>
        )}
      </div>
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : ''

    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-2xl font-bold text-red-400">Homepage Debug</h1>
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm font-mono text-red-300">Error: {errorMessage}</p>
          {errorStack && (
            <pre className="mt-2 text-xs text-red-300/70 whitespace-pre-wrap">{errorStack}</pre>
          )}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-background-secondary p-4">
          <p className="text-sm font-mono text-foreground-muted">Debug: {debugInfo}</p>
        </div>
        <Link href="/players" className="btn-primary mt-6 inline-block">
          Browse Players Instead
        </Link>
      </div>
    )
  }
}
