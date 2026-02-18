import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'
import { MatchDetailClient } from '@/components/match/MatchDetailClient'

interface MatchPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      home_score, away_score, competition, match_date,
      home_club:clubs!matches_home_club_id_fkey ( name ),
      away_club:clubs!matches_away_club_id_fkey ( name )
    `)
    .eq('slug', slug)
    .single()

  if (error || !match) return { title: 'Match Not Found' }
  const home = Array.isArray(match.home_club) ? match.home_club[0] : match.home_club
  const away = Array.isArray(match.away_club) ? match.away_club[0] : match.away_club

  return {
    title: `${home?.name ?? 'TBD'} ${match.home_score}-${match.away_score} ${away?.name ?? 'TBD'} | Georgian Football Talent Platform`,
    description: `${match.competition} match on ${match.match_date}. Full stats and report.`,
  }
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, slug, home_score, away_score, competition, match_date, venue,
      video_url, highlights_url, match_report, match_report_ka,
      home_club:clubs!matches_home_club_id_fkey ( name, name_ka, slug ),
      away_club:clubs!matches_away_club_id_fkey ( name, name_ka, slug ),
      player_stats:match_player_stats (
        minutes_played, goals, assists, pass_accuracy, shots, shots_on_target,
        tackles, interceptions, distance_km, sprints, top_speed_kmh, rating,
        player:players!match_player_stats_player_id_fkey ( name, name_ka, slug, position, club_id )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !match) notFound()

  const homeClub = Array.isArray(match.home_club) ? match.home_club[0] : match.home_club
  const awayClub = Array.isArray(match.away_club) ? match.away_club[0] : match.away_club
  const playerStats = (Array.isArray(match.player_stats) ? match.player_stats : []).map((ps) => ({
    ...ps,
    player: Array.isArray(ps.player) ? ps.player[0] : ps.player,
  }))

  const dateFormatted = format(new Date(match.match_date), 'EEEE, dd MMMM yyyy')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/matches" className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
        &larr; {t('matches.backToMatches')}
      </Link>

      {/* Match header */}
      <div className="mt-4 card text-center">
        <div className="text-sm text-foreground-muted">{match.competition}</div>
        <div className="mt-1 text-xs text-foreground-muted">{dateFormatted} &middot; {match.venue}</div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex-1 text-right">
            {homeClub?.slug ? (
              <Link href={`/clubs/${homeClub.slug}`} className="text-lg font-bold text-foreground hover:text-accent transition-colors">
                <MatchDetailClient type="home_club" name={homeClub.name} name_ka={homeClub.name_ka} />
              </Link>
            ) : (
              <span className="text-lg font-bold text-foreground">{t('matches.tbd')}</span>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-background px-6 py-3 border border-border">
            <span className="text-3xl font-bold text-foreground">{match.home_score ?? '-'}</span>
            <span className="text-xl text-foreground-muted">:</span>
            <span className="text-3xl font-bold text-foreground">{match.away_score ?? '-'}</span>
          </div>

          <div className="flex-1 text-left">
            {awayClub?.slug ? (
              <Link href={`/clubs/${awayClub.slug}`} className="text-lg font-bold text-foreground hover:text-accent transition-colors">
                <MatchDetailClient type="away_club" name={awayClub.name} name_ka={awayClub.name_ka} />
              </Link>
            ) : (
              <span className="text-lg font-bold text-foreground">{t('matches.tbd')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Match report */}
      <MatchDetailClient
        type="report"
        report={match.match_report}
        report_ka={match.match_report_ka}
      />

      {/* Player stats table */}
      {playerStats.length > 0 && (
        <div className="mt-6 card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">{t('matches.playerStats')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-foreground-muted">
                  <th className="pb-2 pr-4">{t('stats.player')}</th>
                  <th className="pb-2 pr-4">{t('stats.pos')}</th>
                  <th className="pb-2 pr-4">{t('stats.min')}</th>
                  <th className="pb-2 pr-4">{t('stats.g')}</th>
                  <th className="pb-2 pr-4">{t('stats.a')}</th>
                  <th className="pb-2 pr-4">{t('stats.rating')}</th>
                  <th className="pb-2 pr-4">{t('stats.passPercent')}</th>
                  <th className="pb-2 pr-4">{t('stats.shots')}</th>
                  <th className="pb-2 pr-4">{t('stats.tackles')}</th>
                  <th className="pb-2 pr-4">{t('stats.dist')}</th>
                  <th className="pb-2">{t('stats.speed')}</th>
                </tr>
              </thead>
              <tbody>
                {playerStats
                  .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
                  .map((ps, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        {ps.player?.slug ? (
                          <Link href={`/players/${ps.player.slug}`} className="font-medium text-accent hover:underline">
                            {ps.player.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">{t('matches.unknown')}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.player?.position ?? '-'}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.minutes_played ?? '-'}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{ps.goals}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{ps.assists}</td>
                      <td className="py-2 pr-4">
                        {ps.rating ? (
                          <span className={`font-bold ${Number(ps.rating) >= 7.5 ? 'text-accent' : Number(ps.rating) >= 6 ? 'text-foreground' : 'text-foreground-muted'}`}>
                            {ps.rating}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.pass_accuracy ? `${ps.pass_accuracy}%` : '-'}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.shots_on_target}/{ps.shots}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.tackles}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ps.distance_km ? `${ps.distance_km}km` : '-'}</td>
                      <td className="py-2 text-foreground-muted">{ps.top_speed_kmh ? `${ps.top_speed_kmh}km/h` : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
