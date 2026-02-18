import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { PlayerCard } from '@/components/player/PlayerCard'
import { MatchCard } from '@/components/match/MatchCard'
import { HomeHero } from '@/components/home/HomeHero'
import { StatsBar } from '@/components/home/StatsBar'

export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()
  const { t } = await getServerT()

  // Fetch all data in parallel
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

  if (fpError) console.error('Failed to fetch featured players:', fpError.message)
  if (rmError) console.error('Failed to fetch recent matches:', rmError.message)
  if (pcError) console.error('Failed to fetch player count:', pcError.message)
  if (ccError) console.error('Failed to fetch club count:', ccError.message)
  if (mcError) console.error('Failed to fetch match count:', mcError.message)

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
}
