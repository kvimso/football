import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation, getRatingColor } from '@/lib/utils'
import { format } from 'date-fns'
import { trackPageView } from '@/lib/analytics'
import { parseJsonObject, getTeamStat, getWidget } from '@/lib/camera/extract'
import type { Database } from '@/lib/database.types'
import type { StarliveTeamsData, StarliveWidgets } from '@/lib/camera/types'
import { TeamComparisonStats } from '@/components/match/TeamComparisonStats'
import { ShotMap } from '@/components/match/ShotMap'
import { AttackDirection } from '@/components/match/AttackDirection'

interface MatchPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MatchPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
      home_score, away_score, competition, match_date,
      home_club:clubs!matches_home_club_id_fkey ( name ),
      away_club:clubs!matches_away_club_id_fkey ( name )
    `
    )
    .eq('slug', slug)
    .single()

  if (error || !match) return { title: 'Match Not Found' }
  const home = unwrapRelation(match.home_club)
  const away = unwrapRelation(match.away_club)

  return {
    title: `${home?.name ?? 'TBD'} ${match.home_score}-${match.away_score} ${away?.name ?? 'TBD'} | Georgian Football Talent Platform`,
    description: `${match.competition} match on ${match.match_date}. Full stats and report.`,
  }
}

// IMPORTANT: These columns must match the select string in the Supabase query below.
type MatchPlayerStatsRow = Database['public']['Tables']['match_player_stats']['Row']
type PlayerStatScalars = Pick<
  MatchPlayerStatsRow,
  | 'minutes_played'
  | 'goals'
  | 'assists'
  | 'pass_success_rate'
  | 'shots'
  | 'shots_on_target'
  | 'tackles'
  | 'interceptions'
  | 'distance_m'
  | 'sprints_count'
  | 'overall_rating'
  | 'key_passes'
>

type PlayerStat = PlayerStatScalars & {
  player: {
    name: string
    name_ka: string
    slug: string
    position: string
    club_id: string
  } | null
}

interface PossessionWidget {
  possession_time: number
  percent: number
}

interface AttackDirectionWidget {
  attack: {
    left: { num: number; percent: number }
    center: { num: number; percent: number }
    right: { num: number; percent: number }
  }
}

function PlayerStatsTable({
  players,
  lang,
  t,
}: {
  players: PlayerStat[]
  lang: string
  t: (key: string) => string
}) {
  if (players.length === 0) return null

  return (
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
            <th className="pb-2">{t('stats.dist')}</th>
          </tr>
        </thead>
        <tbody>
          {players
            .sort((a, b) => (Number(b.overall_rating) || 0) - (Number(a.overall_rating) || 0))
            .map((ps, i) => {
              const ratingTier = ps.overall_rating
                ? getRatingColor(Number(ps.overall_rating))
                : null
              return (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    {ps.player?.slug ? (
                      <Link
                        href={`/players/${ps.player.slug}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lang === 'ka' ? ps.player.name_ka : ps.player.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{t('matches.unknown')}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-foreground-muted">{ps.player?.position ?? '-'}</td>
                  <td className="py-2 pr-4 text-foreground-muted">{ps.minutes_played ?? '-'}</td>
                  <td className="py-2 pr-4 font-semibold text-foreground">{ps.goals ?? 0}</td>
                  <td className="py-2 pr-4 font-semibold text-foreground">{ps.assists ?? 0}</td>
                  <td className="py-2 pr-4">
                    {ratingTier ? (
                      <span className={`font-bold ${ratingTier.class}`}>
                        {Number(ps.overall_rating).toFixed(1)}
                        <span className="sr-only">
                          {' '}
                          (
                          {t(
                            `camera.rating${ratingTier.label.charAt(0).toUpperCase() + ratingTier.label.slice(1)}`
                          )}
                          )
                        </span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 pr-4 text-foreground-muted">
                    {ps.pass_success_rate ? `${ps.pass_success_rate}%` : '-'}
                  </td>
                  <td className="py-2 pr-4 text-foreground-muted">
                    {ps.shots_on_target ?? 0}/{ps.shots ?? 0}
                  </td>
                  <td className="py-2 pr-4 text-foreground-muted">{ps.tackles ?? '-'}</td>
                  <td className="py-2 text-foreground-muted">
                    {ps.distance_m ? `${Math.round(ps.distance_m / 100) / 10}km` : '-'}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}

export default async function MatchPage({ params }: MatchPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { t, lang } = await getServerT()

  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
      id, slug, home_score, away_score, competition, match_date, venue,
      video_url, source, home_club_id, away_club_id,
      team_stats, widgets,
      home_club:clubs!matches_home_club_id_fkey ( name, name_ka, slug ),
      away_club:clubs!matches_away_club_id_fkey ( name, name_ka, slug ),
      player_stats:match_player_stats (
        minutes_played, goals, assists, pass_success_rate, shots, shots_on_target,
        tackles, interceptions, distance_m, sprints_count, overall_rating, key_passes,
        player:players!match_player_stats_player_id_fkey ( name, name_ka, slug, position, club_id )
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (error || !match) notFound()

  trackPageView({ pageType: 'match', entityId: match.id, entitySlug: match.slug })

  const homeClub = unwrapRelation(match.home_club)
  const awayClub = unwrapRelation(match.away_club)

  const rawPlayerStats = match.player_stats as unknown as PlayerStat[]
  const allPlayerStats = Array.isArray(rawPlayerStats) ? rawPlayerStats : []

  // Split players by home/away team
  // TODO: Player team assignment uses current club_id, which can be wrong
  // after transfers. Fix: add club_id column to match_player_stats,
  // populate in extractMatchPlayerStats() in transform.ts.
  const homePlayers = allPlayerStats.filter((ps) => ps.player?.club_id === match.home_club_id)
  const awayPlayers = allPlayerStats.filter((ps) => ps.player?.club_id === match.away_club_id)
  const otherPlayers = allPlayerStats.filter(
    (ps) => ps.player?.club_id !== match.home_club_id && ps.player?.club_id !== match.away_club_id
  )

  // Parse JSONB camera data
  // TODO: team_stats JSONB includes full event arrays (~70 categories x events).
  // We only use .count/.count_accurate/.percent/.value per stat.
  // When real Starlive data is flowing, measure JSONB size and consider:
  // (a) Supabase RPC to extract summary server-side, or
  // (b) Separate report_summary column populated at sync time.
  const teamStats = parseJsonObject<StarliveTeamsData>(match.team_stats)
  const widgets = parseJsonObject<StarliveWidgets>(match.widgets)

  const homeTeamStats = teamStats?.['1']
  const awayTeamStats = teamStats?.['2']

  // Extract widget data
  const homePossession = getWidget<PossessionWidget>(widgets, '1', 'possession')
  const awayPossession = getWidget<PossessionWidget>(widgets, '2', 'possession')
  const homeShotZones = getWidget<Record<string, number>>(widgets, '1', 'shots_zones')
  const awayShotZones = getWidget<Record<string, number>>(widgets, '2', 'shots_zones')
  const homeOnTargetZones = getWidget<Record<string, number>>(widgets, '1', 'shots_on_target_zones')
  const awayOnTargetZones = getWidget<Record<string, number>>(widgets, '2', 'shots_on_target_zones')
  const homeAttackDir = getWidget<AttackDirectionWidget>(widgets, '1', 'attacks_direction')
  const awayAttackDir = getWidget<AttackDirectionWidget>(widgets, '2', 'attacks_direction')

  // Build comparison data from team stats
  const hasTeamStats = homeTeamStats && awayTeamStats
  const homeStatsMap: Record<string, ReturnType<typeof getTeamStat>> = {}
  const awayStatsMap: Record<string, ReturnType<typeof getTeamStat>> = {}
  if (hasTeamStats) {
    const statKeys = [
      'shots',
      'passes',
      'tackles',
      'corners',
      'free_kicks',
      'fouls',
      'expected_goals',
    ]
    for (const key of statKeys) {
      homeStatsMap[key] = getTeamStat(homeTeamStats, key)
      awayStatsMap[key] = getTeamStat(awayTeamStats, key)
    }
  }

  const hasShotMap = homeShotZones || awayShotZones
  const hasAttackDir = homeAttackDir || awayAttackDir
  const hasCameraData = hasTeamStats || hasShotMap || hasAttackDir
  const isPixellot = match.source === 'pixellot'

  const homeTeamName = homeClub
    ? lang === 'ka'
      ? homeClub.name_ka
      : homeClub.name
    : t('matches.home')
  const awayTeamName = awayClub
    ? lang === 'ka'
      ? awayClub.name_ka
      : awayClub.name
    : t('matches.away')

  const dateFormatted = format(new Date(match.match_date), 'EEEE, dd MMMM yyyy')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/matches"
        className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        &larr; {t('matches.backToMatches')}
      </Link>

      {/* Match header */}
      <div className="mt-4 card text-center">
        <div className="text-sm text-foreground-muted">{match.competition}</div>
        <div className="mt-1 text-xs text-foreground-muted">
          {dateFormatted} &middot; {match.venue}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex-1 text-right">
            {homeClub?.slug ? (
              <Link
                href={`/clubs/${homeClub.slug}`}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                {lang === 'ka' ? homeClub.name_ka : homeClub.name}
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
              <Link
                href={`/clubs/${awayClub.slug}`}
                className="text-lg font-bold text-foreground hover:text-primary transition-colors"
              >
                {lang === 'ka' ? awayClub.name_ka : awayClub.name}
              </Link>
            ) : (
              <span className="text-lg font-bold text-foreground">{t('matches.tbd')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Verified by Pixellot badge */}
      {isPixellot && (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t('players.verifiedByPixellot')}
          </span>
        </div>
      )}

      {/* Video links */}
      {match.video_url && (
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={match.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
          >
            <svg className="h-4 w-4 text-danger" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {t('matches.watchFullMatch')}
          </a>
        </div>
      )}

      {/* Camera data sections */}
      {hasCameraData ? (
        <>
          {/* Team Comparison */}
          {hasTeamStats && (
            <div className="mt-6 card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                {t('matches.teamComparison')}
              </h3>
              <div className="mb-3 flex justify-between text-xs font-medium text-foreground-muted">
                <span>{homeTeamName}</span>
                <span>{awayTeamName}</span>
              </div>
              <TeamComparisonStats
                homeStats={homeStatsMap}
                awayStats={awayStatsMap}
                homePossession={homePossession?.percent ?? null}
                awayPossession={awayPossession?.percent ?? null}
                t={t}
              />
            </div>
          )}

          {/* Shot Map */}
          {hasShotMap && (
            <div className="mt-6 card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">{t('matches.shotMap')}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-center text-xs font-medium text-foreground-muted">
                    {homeTeamName}
                  </div>
                  <ShotMap
                    zones={homeShotZones}
                    onTargetZones={homeOnTargetZones}
                    teamName={homeTeamName}
                    t={t}
                  />
                </div>
                <div>
                  <div className="mb-2 text-center text-xs font-medium text-foreground-muted">
                    {awayTeamName}
                  </div>
                  <ShotMap
                    zones={awayShotZones}
                    onTargetZones={awayOnTargetZones}
                    teamName={awayTeamName}
                    t={t}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attack Direction */}
          {hasAttackDir && (
            <div className="mt-6 card">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                {t('matches.attackDirection')}
              </h3>
              <AttackDirection
                homeAttack={homeAttackDir ? homeAttackDir.attack : null}
                awayAttack={awayAttackDir ? awayAttackDir.attack : null}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                t={t}
              />
            </div>
          )}
        </>
      ) : (
        /* Empty state when no camera data */
        allPlayerStats.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
            <div className="text-3xl text-foreground-muted/30 mb-3">&#128247;</div>
            <p className="text-sm text-foreground-muted">{t('camera.noDataYet')}</p>
          </div>
        )
      )}

      {/* Player Ratings — Home team */}
      {homePlayers.length > 0 && (
        <div className="mt-6 card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {t('matches.playerStats')} — {homeTeamName}
          </h3>
          <PlayerStatsTable players={homePlayers} lang={lang} t={t} />
        </div>
      )}

      {/* Player Ratings — Away team */}
      {awayPlayers.length > 0 && (
        <div className="mt-6 card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {t('matches.playerStats')} — {awayTeamName}
          </h3>
          <PlayerStatsTable players={awayPlayers} lang={lang} t={t} />
        </div>
      )}

      {/* Players not matching either team (fallback) */}
      {otherPlayers.length > 0 && (
        <div className="mt-6 card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">{t('matches.playerStats')}</h3>
          <PlayerStatsTable players={otherPlayers} lang={lang} t={t} />
        </div>
      )}
    </div>
  )
}
