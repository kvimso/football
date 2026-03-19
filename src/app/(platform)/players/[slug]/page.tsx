import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge, unwrapRelation, getRatingColor } from '@/lib/utils'
import type { Position, PlayerStatus } from '@/lib/types'
import type { Database } from '@/lib/database.types'
import { format } from 'date-fns'
import { RadarChart } from '@/components/player/RadarChart'
import { StatBar } from '@/components/player/StatBar'
import { CountUpStat } from '@/components/player/CountUpStat'
import { ProfileSubNav } from '@/components/player/ProfileSubNav'
import { PlayerProfileClient } from '@/components/player/PlayerProfileClient'
import { WatchButton } from '@/components/player/WatchButton'
import { MessageAcademyButton } from '@/components/chat/MessageAcademyButton'
import { trackPageView } from '@/lib/analytics'
import { trackPlayerView } from '@/app/actions/player-views'
import { BLUR_DATA_URL, POSITION_BORDER_CLASSES, POPULAR_VIEWS_THRESHOLD } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import { DownloadPdfButton } from '@/components/player/DownloadPdfButton'
import { PlayerCard } from '@/components/player/PlayerCard'
import { MatchStatDetail } from '@/components/player/MatchStatDetail'

interface PlayerPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: player, error } = await supabase
    .from('players')
    .select('name, position')
    .eq('slug', slug)
    .single()

  if (error || !player) return { title: 'Player Not Found' }

  return {
    title: `${player.name} — ${player.position} | Georgian Football Talent Platform`,
    description: `Scouting profile for ${player.name}. View stats, skills, match history, and scouting reports.`,
  }
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { t, lang } = await getServerT()

  const { data: player, error } = await supabase
    .from('players')
    .select(
      `
      id, name, name_ka, slug, date_of_birth, nationality, position,
      preferred_foot, height_cm, weight_kg, photo_url, jersey_number,
      scouting_report, scouting_report_ka, status, is_featured,
      platform_id,
      club:clubs!players_club_id_fkey ( id, name, name_ka, slug ),
      skills:player_skills ( overall, attack, defence, fitness, dribbling, shooting, possession, tackling, positioning, matches_counted, last_updated ),
      match_stats:match_player_stats (
        minutes_played, goals, assists, pass_success_rate, shots, shots_on_target,
        tackles, interceptions, distance_m, sprints_count, overall_rating,
        key_passes, passes_total, passes_successful, dribbles_success, dribbles_fail, speed_avg,
        match:matches!match_player_stats_match_id_fkey (
          slug, match_date, competition,
          home_club:clubs!matches_home_club_id_fkey ( name, name_ka ),
          away_club:clubs!matches_away_club_id_fkey ( name, name_ka )
        )
      ),
      club_history:player_club_history (
        id, joined_at, left_at,
        club:clubs!player_club_history_club_id_fkey ( name, name_ka, slug )
      ),
      videos:player_videos ( id, title, url, video_type, duration_seconds )
    `
    )
    .eq('slug', slug)
    .single()

  if (error || !player) notFound()

  void trackPageView({ pageType: 'player', entityId: player.id, entitySlug: player.slug })
  void trackPlayerView(player.id)

  const age = calculateAge(player.date_of_birth)
  const club = unwrapRelation(player.club)

  type PlayerSkillsRow = Database['public']['Tables']['player_skills']['Row']
  type MatchPlayerStatsRow = Database['public']['Tables']['match_player_stats']['Row']

  // IMPORTANT: These columns must match the select string in the Supabase query above.
  // Pick<> validates column names against the schema, but does NOT verify they are fetched.
  type CameraSkills = Pick<
    PlayerSkillsRow,
    | 'overall'
    | 'attack'
    | 'defence'
    | 'fitness'
    | 'dribbling'
    | 'shooting'
    | 'possession'
    | 'tackling'
    | 'positioning'
    | 'matches_counted'
    | 'last_updated'
  >

  type MatchStatScalars = Pick<
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
    | 'passes_total'
    | 'passes_successful'
    | 'dribbles_success'
    | 'dribbles_fail'
    | 'speed_avg'
  >

  // Combined type for match stats with nested join
  type MatchStatWithMatch = MatchStatScalars & {
    match: {
      slug: string
      match_date: string
      competition: string
      home_club: { name: string; name_ka: string } | null
      away_club: { name: string; name_ka: string } | null
    } | null
  }

  const skills = unwrapRelation(player.skills as unknown as CameraSkills | CameraSkills[])

  // Sort match stats by date (most recent first) — client-side sort because
  // PostgREST nested ordering across match_player_stats → matches join is unreliable
  const toTime = (d: string | undefined | null) => (d ? new Date(d).getTime() : 0)
  const rawMatchStats = Array.isArray(player.match_stats)
    ? (player.match_stats as unknown as MatchStatWithMatch[])
    : []
  const matchStats = [...rawMatchStats]
    .map((ms) => ({
      ...ms,
      match: unwrapRelation(ms.match),
    }))
    .sort((a, b) => toTime(b.match?.match_date) - toTime(a.match?.match_date))

  const clubHistory = (Array.isArray(player.club_history) ? player.club_history : [])
    .map((h) => ({
      ...h,
      club: unwrapRelation(h.club),
    }))
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
  const videos = (Array.isArray(player.videos) ? player.videos : []).filter((v) =>
    v.url.startsWith('https://')
  )
  const isFreeAgent = player.status === 'free_agent'

  // Season aggregation — single-pass, null-safe
  interface SeasonAccumulator {
    goals: number
    assists: number
    minutes: number
    distance: number
    passesTotal: number
    passesSuccessful: number
    ratingSum: number
    ratingCount: number
  }

  const initial: SeasonAccumulator = {
    goals: 0,
    assists: 0,
    minutes: 0,
    distance: 0,
    passesTotal: 0,
    passesSuccessful: 0,
    ratingSum: 0,
    ratingCount: 0,
  }

  // TODO: Extract to src/lib/camera/stats.ts when PDF route needs camera stats
  const season = matchStats.reduce<SeasonAccumulator>((acc, ms) => {
    acc.goals += ms.goals ?? 0
    acc.assists += ms.assists ?? 0
    acc.minutes += ms.minutes_played ?? 0
    acc.distance += ms.distance_m ?? 0
    acc.passesTotal += ms.passes_total ?? 0
    acc.passesSuccessful += ms.passes_successful ?? 0
    if (ms.overall_rating != null) {
      acc.ratingSum += Number(ms.overall_rating)
      acc.ratingCount++
    }
    return acc
  }, initial)

  const avgRating = season.ratingCount > 0 ? season.ratingSum / season.ratingCount : null
  const avgPassAccuracy =
    season.passesTotal > 0 ? Math.round((season.passesSuccessful / season.passesTotal) * 100) : null
  const totalDistanceKm = Math.round(season.distance / 100) / 10

  // Build similar players query
  const dob = new Date(player.date_of_birth)
  const dobMinus2 = new Date(dob)
  dobMinus2.setFullYear(dob.getFullYear() - 2)
  const dobPlus2 = new Date(dob)
  dobPlus2.setFullYear(dob.getFullYear() + 2)

  const similarLimit = player.club && !isFreeAgent ? 8 : 4

  // Run view counts, auth, and similar players in parallel (3 queries instead of sequential)
  const [viewCountResult, authResult, similarResult] = await Promise.all([
    supabase.rpc('get_player_view_counts', { player_ids: [player.id] }).then(
      (res) => res,
      () => ({ data: null, error: { message: 'RPC failed' } })
    ),
    supabase.auth.getUser(),
    supabase
      .from('players')
      .select(
        `
        id, slug, name, name_ka, position, date_of_birth, height_cm,
        preferred_foot, is_featured, photo_url, status,
        club:clubs!players_club_id_fkey ( name, name_ka )
      `
      )
      .eq('position', player.position)
      .neq('id', player.id)
      .in('status', ['active', 'free_agent'])
      .gte('date_of_birth', dobMinus2.toISOString().split('T')[0])
      .lte('date_of_birth', dobPlus2.toISOString().split('T')[0])
      .limit(similarLimit),
  ])

  // Extract view counts
  let totalViews = 0
  let recentViews = 0
  let previousViews = 0
  if (!viewCountResult.error && viewCountResult.data?.[0]) {
    totalViews = Number(viewCountResult.data[0].total_views)
    recentViews = Number(viewCountResult.data[0].weekly_views)
    previousViews = Number(viewCountResult.data[0].prev_week_views)
  }
  const isTrending = recentViews > previousViews && recentViews > 0
  const isPopular = totalViews >= POPULAR_VIEWS_THRESHOLD

  // Extract auth + user data
  const {
    data: { user },
    error: authError,
  } = authResult
  if (authError) console.error('Failed to get user:', authError.message)

  let isWatched = false
  let userRole: string | null = null

  if (user) {
    const [watchlistResult, profileResult] = await Promise.all([
      supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle(),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
    ])

    if (watchlistResult.error)
      console.error('Failed to check watchlist:', watchlistResult.error.message)
    isWatched = !!watchlistResult.data

    if (profileResult.error) console.error('Failed to fetch profile:', profileResult.error.message)
    userRole = profileResult.data?.role ?? null
  }

  // Extract similar players
  const rawSimilar = similarResult.data

  // Process similar players — prefer different clubs, take up to 4
  const similarPlayers = (rawSimilar ?? [])
    .map((p) => {
      const pClub = unwrapRelation(p.club)
      return {
        ...p,
        position: p.position as Position,
        status: (p.status ?? 'active') as PlayerStatus,
        club: pClub,
        _sameClub: pClub?.name === club?.name,
      }
    })
    .sort((a, b) => {
      // Different club first
      if (a._sameClub && !b._sameClub) return 1
      if (!a._sameClub && b._sameClub) return -1
      return 0
    })
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/players"
        className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        &larr; {t('players.backToPlayers')}
      </Link>

      {/* Hero — photo bleeds to card edge */}
      <div
        id="overview"
        className={`mt-4 overflow-hidden rounded-xl border border-border bg-surface border-t-4 ${POSITION_BORDER_CLASSES[player.position as Position] ?? 'border-t-primary'}`}
      >
        <div className="flex flex-col md:flex-row">
          {/* Photo — full-bleed within card */}
          <div className="relative h-64 w-full shrink-0 bg-elevated md:h-auto md:w-60">
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 240px"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <PlayerSilhouette size="lg" className="text-foreground-muted/20" />
              </div>
            )}
          </div>

          {/* Info — with padding */}
          <div className="flex-1 p-5 md:p-6">
            <PlayerProfileClient
              player={{
                name: player.name,
                name_ka: player.name_ka,
                position: player.position as Position,
                is_featured: player.is_featured,
                scouting_report: player.scouting_report,
                scouting_report_ka: player.scouting_report_ka,
                club_name: club?.name ?? null,
                club_name_ka: club?.name_ka ?? null,
                club_slug: club?.slug ?? null,
                platform_id: player.platform_id,
                status: player.status as PlayerStatus | null,
              }}
            />

            {/* Badges row */}
            {(isPopular || isTrending) && (
              <div className="mt-2 flex items-center gap-2">
                {isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pos-gk-bg px-2.5 py-0.5 text-xs font-semibold text-pos-gk">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
                    </svg>
                    {t('players.popular')}
                  </span>
                )}
                {isTrending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
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
                        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                      />
                    </svg>
                    {t('players.trending')}
                  </span>
                )}
              </div>
            )}

            {/* Camera skills summary — rating badge + attack/defence/fitness */}
            {skills && skills.overall != null && (
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-3 sm:gap-x-8">
                <div>
                  <div
                    className={`text-3xl font-bold tabular-nums sm:text-5xl ${getRatingColor(skills.overall).class}`}
                  >
                    {skills.overall.toFixed(1)}
                    <span className="sr-only">
                      {` — ${t(`camera.rating${getRatingColor(skills.overall).label.charAt(0).toUpperCase() + getRatingColor(skills.overall).label.slice(1)}`)}`}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-foreground-muted">
                    {t('camera.overallRating')}
                  </div>
                </div>
                {skills.attack != null && (
                  <CountUpStat value={skills.attack} label={t('skills.attack')} />
                )}
                {skills.defence != null && (
                  <CountUpStat value={skills.defence} label={t('skills.defence')} />
                )}
                {skills.fitness != null && (
                  <CountUpStat value={skills.fitness} label={t('skills.fitness')} />
                )}
              </div>
            )}

            {/* Free agent notice */}
            {isFreeAgent && (
              <div className="mt-3 rounded-lg border border-pos-gk/30 bg-pos-gk-bg p-3 text-sm text-pos-gk">
                {t('players.freeAgentNotice')}
              </div>
            )}

            {/* Action buttons */}
            {user && (
              <div className="mt-4 flex flex-wrap gap-3">
                <WatchButton playerId={player.id} isWatched={isWatched} size="md" />
                {!isFreeAgent && userRole === 'scout' && club?.id && (
                  <MessageAcademyButton clubId={club.id} />
                )}
                <Link
                  href={`/players/compare?p1=${player.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                  {t('compare.comparePlayer')}
                </Link>
                <DownloadPdfButton playerId={player.id} playerName={player.name} />
              </div>
            )}

            {/* Meta grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {player.platform_id && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs text-foreground-muted">{t('players.platformId')}</div>
                  <div className="font-mono font-semibold text-foreground">
                    {player.platform_id}
                  </div>
                </div>
              )}
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <div className="text-xs text-foreground-muted">{t('players.age')}</div>
                <div className="font-semibold text-foreground">{age}</div>
              </div>
              {player.height_cm && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs text-foreground-muted">{t('players.height')}</div>
                  <div className="font-semibold text-foreground">
                    {player.height_cm} {t('players.cm')}
                  </div>
                </div>
              )}
              {player.weight_kg && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs text-foreground-muted">{t('players.weight')}</div>
                  <div className="font-semibold text-foreground">
                    {player.weight_kg} {t('players.kg')}
                  </div>
                </div>
              )}
              {player.preferred_foot && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs text-foreground-muted">{t('players.foot')}</div>
                  <div className="font-semibold text-foreground">
                    {t('foot.' + player.preferred_foot)}
                  </div>
                </div>
              )}
              {player.jersey_number && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-xs text-foreground-muted">{t('players.jersey')}</div>
                  <div className="font-semibold text-foreground">#{player.jersey_number}</div>
                </div>
              )}
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <div className="text-xs text-foreground-muted">{t('players.nationality')}</div>
                <div className="font-semibold text-foreground">
                  {player.nationality ? t('nationality.' + player.nationality) : '-'}
                </div>
              </div>
              {totalViews > 0 && (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex items-center gap-1 text-xs text-foreground-muted">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t('players.scoutViews')}
                  </div>
                  <div className="font-semibold text-foreground">{totalViews}</div>
                  {recentViews > 0 && (
                    <div className="mt-0.5 text-[11px] text-foreground-muted">
                      {recentViews} {t('players.thisWeek')}
                      {previousViews > 0 ? (
                        (() => {
                          const pct = Math.round(
                            ((recentViews - previousViews) / previousViews) * 100
                          )
                          return (
                            <span className={pct >= 0 ? 'text-primary' : 'text-danger'}>
                              {' '}
                              ({pct >= 0 ? '+' : ''}
                              {pct}%)
                            </span>
                          )
                        })()
                      ) : (
                        <span className="text-primary"> ({t('players.new')})</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky sub-nav with scroll spy */}
      <ProfileSubNav
        hiddenSections={[
          ...(!skills ? ['stats' as const] : []),
          ...(matchStats.length === 0 ? ['matches' as const] : []),
          ...(clubHistory.length === 0 ? ['history' as const] : []),
        ]}
      />

      {/* Season Summary — aggregated camera stats */}
      {matchStats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="text-xs text-foreground-muted">{t('camera.matchesPlayed')}</div>
            <div className="text-lg font-bold tabular-nums">{matchStats.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="text-xs text-foreground-muted">{t('camera.totalGoals')}</div>
            <div className="text-lg font-bold tabular-nums">{season.goals}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="text-xs text-foreground-muted">{t('camera.totalAssists')}</div>
            <div className="text-lg font-bold tabular-nums">{season.assists}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="text-xs text-foreground-muted">{t('camera.totalMinutes')}</div>
            <div className="text-lg font-bold tabular-nums">{season.minutes}</div>
          </div>
          {avgRating != null && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="text-xs text-foreground-muted">{t('camera.avgRating')}</div>
              <div className={`text-lg font-bold tabular-nums ${getRatingColor(avgRating).class}`}>
                {avgRating.toFixed(1)}
                <span className="sr-only">
                  {` — ${t(`camera.rating${getRatingColor(avgRating).label.charAt(0).toUpperCase() + getRatingColor(avgRating).label.slice(1)}`)}`}
                </span>
              </div>
            </div>
          )}
          {avgPassAccuracy != null && (
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="text-xs text-foreground-muted">{t('camera.avgPassAccuracy')}</div>
              <div className="text-lg font-bold tabular-nums">{avgPassAccuracy}%</div>
            </div>
          )}
          <div className="rounded-lg border border-border bg-surface px-3 py-2.5">
            <div className="text-xs text-foreground-muted">{t('camera.totalDistance')}</div>
            <div className="text-lg font-bold tabular-nums">{totalDistanceKm} km</div>
          </div>
        </div>
      )}

      {/* Skills: Radar + Grouped Stat Bars */}
      {skills && (
        <div id="stats" className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Radar chart */}
          <div className="card">
            <h3 className="section-header mb-2">{t('players.skills')}</h3>
            <div className="mb-4 ml-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-primary">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {t('players.verifiedByPixellot')}
              </span>
            </div>
            <RadarChart
              skills={skills}
              labels={['attack', 'shooting', 'possession', 'dribbling', 'defence', 'fitness'].map(
                (k) => t('skills.' + k)
              )}
            />
          </div>

          {/* Grouped stat bars */}
          <div className="card lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Attacking */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="h-4 w-4 text-pos-att"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t('players.attacking')}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <StatBar label={t('skills.attack')} value={skills.attack} maxValue={10} />
                  <StatBar label={t('skills.shooting')} value={skills.shooting} maxValue={10} />
                  <StatBar label={t('skills.dribbling')} value={skills.dribbling} maxValue={10} />
                </div>
              </div>

              {/* Passing */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="h-4 w-4 text-pos-mid"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t('players.passingCategory')}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <StatBar label={t('skills.possession')} value={skills.possession} maxValue={10} />
                  <StatBar
                    label={t('skills.positioning')}
                    value={skills.positioning}
                    maxValue={10}
                  />
                </div>
              </div>

              {/* Defensive */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="h-4 w-4 text-pos-def"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t('players.defensive')}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <StatBar label={t('skills.defence')} value={skills.defence} maxValue={10} />
                  <StatBar label={t('skills.tackling')} value={skills.tackling} maxValue={10} />
                </div>
              </div>

              {/* Physical */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="h-4 w-4 text-pos-wng"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t('players.physicalCategory')}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <StatBar label={t('skills.fitness')} value={skills.fitness} maxValue={10} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match appearances — expandable list */}
      {matchStats.length > 0 && (
        <div id="matches" className="mt-6">
          <h3 className="section-header mb-4">{t('players.matchHistory')}</h3>
          <div className="space-y-2">
            {matchStats.map((ms, i) => {
              const m = ms.match
              const homeClub = m ? unwrapRelation(m.home_club) : null
              const awayClub = m ? unwrapRelation(m.away_club) : null
              const homeName = homeClub ? (lang === 'ka' ? homeClub.name_ka : homeClub.name) : null
              const awayName = awayClub ? (lang === 'ka' ? awayClub.name_ka : awayClub.name) : null
              const matchLabel =
                homeName && awayName ? `${homeName} vs ${awayName}` : t('stats.match')
              const matchDate = m?.match_date ? format(new Date(m.match_date), 'MMM d, yyyy') : '-'

              return (
                <details
                  key={i}
                  className="group overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated [&::-webkit-details-marker]:hidden">
                    {/* Date */}
                    <span className="w-24 shrink-0 text-xs text-foreground-muted">{matchDate}</span>
                    {/* Opponent */}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {matchLabel}
                    </span>
                    {/* Event icons */}
                    <span className="flex items-center gap-2 text-xs">
                      {(ms.goals ?? 0) > 0 && (
                        <span className="font-semibold text-primary">{ms.goals}G</span>
                      )}
                      {(ms.assists ?? 0) > 0 && (
                        <span className="font-semibold text-primary">{ms.assists}A</span>
                      )}
                    </span>
                    {/* Rating */}
                    {ms.overall_rating != null && (
                      <span
                        className={`w-8 text-right text-sm font-bold ${getRatingColor(Number(ms.overall_rating)).class}`}
                      >
                        {Number(ms.overall_rating).toFixed(1)}
                        <span className="sr-only">
                          {` — ${t(`camera.rating${getRatingColor(Number(ms.overall_rating)).label.charAt(0).toUpperCase() + getRatingColor(Number(ms.overall_rating)).label.slice(1)}`)}`}
                        </span>
                      </span>
                    )}
                    {/* Chevron */}
                    <svg
                      className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </summary>
                  {/* Expanded stats — categorized breakdown */}
                  <MatchStatDetail stats={ms} matchSlug={m?.slug ?? null} t={t} />
                </details>
              )
            })}
          </div>
        </div>
      )}

      {/* Career history — vertical timeline */}
      {clubHistory.length > 0 && (
        <div id="history" className="mt-6">
          <h3 className="section-header mb-4">{t('players.careerHistory')}</h3>
          <div className="relative ml-3 space-y-6 border-l-2 border-primary/30 pl-6">
            {clubHistory.map((entry) => {
              const entryClubName = entry.club
                ? lang === 'ka'
                  ? entry.club.name_ka
                  : entry.club.name
                : t('matches.unknown')
              const isCurrent = !entry.left_at
              return (
                <div key={entry.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 ${
                      isCurrent ? 'border-primary bg-primary' : 'border-primary/50 bg-surface'
                    }`}
                  />
                  {/* Content */}
                  <div>
                    {entry.club?.slug ? (
                      <Link
                        href={`/clubs/${entry.club.slug}`}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {entryClubName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">{entryClubName}</span>
                    )}
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {format(new Date(entry.joined_at), 'MMM d, yyyy')} &mdash;{' '}
                      {entry.left_at
                        ? format(new Date(entry.left_at), 'MMM d, yyyy')
                        : t('players.present')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Videos */}
      <div id="videos" className="mt-6">
        <h3 className="section-header mb-4">{t('players.videos')}</h3>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {videos.map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-elevated"
              >
                {/* Play icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{v.title}</div>
                  <div className="text-xs text-foreground-muted">
                    {v.video_type && <span className="capitalize">{v.video_type}</span>}
                    {v.duration_seconds && (
                      <span>
                        {v.video_type && ' · '}
                        {Math.floor(v.duration_seconds / 60)}:
                        {String(v.duration_seconds % 60).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
                {/* External link icon */}
                <svg
                  className="h-4 w-4 shrink-0 text-foreground-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            ))}
          </div>
        ) : (
          /* Empty state — tasteful, expectation-setting */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <svg
              className="mb-3 h-10 w-10 text-foreground-muted/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <p className="text-sm text-foreground-muted">{t('players.noVideos')}</p>
            <p className="mt-1 text-xs text-foreground-faint">{t('players.noVideosHint')}</p>
          </div>
        )}
      </div>

      {/* Similar Players */}
      {similarPlayers.length > 0 && (
        <div className="mt-6">
          <h3 className="section-header mb-4">{t('players.similarPlayers')}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {similarPlayers.map((sp) => (
              <PlayerCard key={sp.slug} player={sp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
