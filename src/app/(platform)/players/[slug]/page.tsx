import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge, unwrapRelation } from '@/lib/utils'
import type { Position, PlayerStatus } from '@/lib/types'
import { format } from 'date-fns'
import { RadarChart } from '@/components/player/RadarChart'
import { PlayerProfileClient } from '@/components/player/PlayerProfileClient'
import { ShortlistButton } from '@/components/player/ShortlistButton'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'
import { trackPageView } from '@/lib/analytics'
import { trackPlayerView } from '@/app/actions/player-views'
import { BLUR_DATA_URL, POSITION_BORDER_CLASSES, POPULAR_VIEWS_THRESHOLD } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import { DownloadPdfButton } from '@/components/player/DownloadPdfButton'
import { PlayerCard } from '@/components/player/PlayerCard'

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
    .select(`
      id, name, name_ka, slug, date_of_birth, nationality, position,
      preferred_foot, height_cm, weight_kg, photo_url, jersey_number,
      scouting_report, scouting_report_ka, status, is_featured,
      platform_id,
      club:clubs!players_club_id_fkey ( name, name_ka, slug ),
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
    .eq('slug', slug)
    .single()

  if (error || !player) notFound()

  void trackPageView({ pageType: 'player', entityId: player.id, entitySlug: player.slug })
  void trackPlayerView(player.id)

  // Fetch view counts for this player using regular client (RLS allows authenticated reads)
  let totalViews = 0
  let recentViews = 0
  let previousViews = 0
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [totalResult, recentResult, previousResult] = await Promise.all([
      supabase
        .from('player_views')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', player.id),
      supabase
        .from('player_views')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', player.id)
        .gte('viewed_at', sevenDaysAgo),
      supabase
        .from('player_views')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', player.id)
        .gte('viewed_at', fourteenDaysAgo)
        .lt('viewed_at', sevenDaysAgo),
    ])

    if (!totalResult.error) totalViews = totalResult.count ?? 0
    if (!recentResult.error) recentViews = recentResult.count ?? 0
    if (!previousResult.error) previousViews = previousResult.count ?? 0
  } catch {
    // View counts are non-critical
  }

  const isTrending = recentViews > previousViews && recentViews > 0
  const isPopular = totalViews >= POPULAR_VIEWS_THRESHOLD

  // Check if user is logged in and has shortlisted/contacted this player
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('Failed to get user:', authError.message)

  let isShortlisted = false
  let hasContactRequest = false

  if (user) {
    const [shortlistResult, contactResult] = await Promise.all([
      supabase
        .from('shortlists')
        .select('id')
        .eq('scout_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle(),
      supabase
        .from('contact_requests')
        .select('id')
        .eq('scout_id', user.id)
        .eq('player_id', player.id)
        .maybeSingle(),
    ])

    if (shortlistResult.error) console.error('Failed to check shortlist:', shortlistResult.error.message)
    isShortlisted = !!shortlistResult.data

    if (contactResult.error) console.error('Failed to check contact request:', contactResult.error.message)
    hasContactRequest = !!contactResult.data
  }

  const age = calculateAge(player.date_of_birth)
  const club = unwrapRelation(player.club)
  const skills = unwrapRelation(player.skills)
  const seasonStats = Array.isArray(player.season_stats) ? player.season_stats : player.season_stats ? [player.season_stats] : []
  const matchStats = (Array.isArray(player.match_stats) ? player.match_stats : []).map((ms) => ({
    ...ms,
    match: unwrapRelation(ms.match),
  }))
  const clubHistory = (Array.isArray(player.club_history) ? player.club_history : [])
    .map((h) => ({
      ...h,
      club: unwrapRelation(h.club),
    }))
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
  const isFreeAgent = player.status === 'free_agent'

  // Fetch similar players: same position, similar age (±2 years), different club
  const dob = new Date(player.date_of_birth)
  const dobMinus2 = new Date(dob)
  dobMinus2.setFullYear(dob.getFullYear() - 2)
  const dobPlus2 = new Date(dob)
  dobPlus2.setFullYear(dob.getFullYear() + 2)

  let similarQuery = supabase
    .from('players')
    .select(`
      slug, name, name_ka, position, date_of_birth, height_cm,
      preferred_foot, is_featured, photo_url, status,
      club:clubs!players_club_id_fkey ( name, name_ka ),
      season_stats:player_season_stats ( season, goals, assists, matches_played )
    `)
    .eq('position', player.position)
    .neq('id', player.id)
    .in('status', ['active', 'free_agent'])
    .gte('date_of_birth', dobMinus2.toISOString().split('T')[0])
    .lte('date_of_birth', dobPlus2.toISOString().split('T')[0])
    .limit(4)

  // Fetch extra so we can prefer players from different clubs
  if (player.club && !isFreeAgent) {
    similarQuery = similarQuery.limit(8)
  }

  const { data: rawSimilar } = await similarQuery

  // Process similar players — prefer different clubs, take up to 4
  const similarPlayers = (rawSimilar ?? [])
    .map((p) => {
      const pClub = unwrapRelation(p.club)
      const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
      const latestStats = statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null
      return {
        ...p,
        position: p.position as Position,
        status: (p.status ?? 'active') as PlayerStatus,
        club: pClub,
        season_stats: latestStats,
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
      <Link href="/players" className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
        &larr; {t('players.backToPlayers')}
      </Link>

      {/* Player header */}
      <div className={`mt-4 card border-t-4 ${POSITION_BORDER_CLASSES[player.position as Position] ?? 'border-t-accent'}`}>
        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          {/* Photo */}
          <div className="relative flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background border border-border">
            {player.photo_url ? (
              <Image src={player.photo_url} alt={player.name} fill className="object-cover" sizes="224px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
            ) : (
              <PlayerSilhouette size="lg" className="text-foreground-muted/20" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <PlayerProfileClient player={{
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
            }} />

            {/* Badges row */}
            {(isPopular || isTrending) && (
              <div className="mt-2 flex items-center gap-2">
                {isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
                    </svg>
                    {t('players.popular')}
                  </span>
                )}
                {isTrending && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    {t('players.trending')}
                  </span>
                )}
              </div>
            )}

            {/* Free agent notice */}
            {isFreeAgent && (
              <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
                {t('players.freeAgentNotice')}
              </div>
            )}

            {/* Action buttons */}
            {user && (
              <div className="mt-4 flex flex-wrap gap-3">
                <ShortlistButton playerId={player.id} isShortlisted={isShortlisted} size="md" />
                {!isFreeAgent && (
                  !hasContactRequest ? (
                    <ContactRequestForm playerId={player.id} />
                  ) : (
                    <span className="rounded-lg bg-accent-muted/30 px-4 py-2 text-sm font-medium text-accent">
                      {t('players.requestSent')}
                    </span>
                  )
                )}
                <Link
                  href={`/players/compare?p1=${player.slug}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:border-accent/50 transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  {t('compare.comparePlayer')}
                </Link>
                <DownloadPdfButton playerId={player.id} playerName={player.name} />
              </div>
            )}

            {/* Meta grid */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {player.platform_id && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs">{t('players.platformId')}</div>
                  <div className="font-mono font-semibold text-foreground">{player.platform_id}</div>
                </div>
              )}
              <div className="rounded-lg bg-background px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.age')}</div>
                <div className="font-semibold text-foreground">{age}</div>
              </div>
              {player.height_cm && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs">{t('players.height')}</div>
                  <div className="font-semibold text-foreground">{player.height_cm} {t('players.cm')}</div>
                </div>
              )}
              {player.weight_kg && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs">{t('players.weight')}</div>
                  <div className="font-semibold text-foreground">{player.weight_kg} {t('players.kg')}</div>
                </div>
              )}
              {player.preferred_foot && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs">{t('players.foot')}</div>
                  <div className="font-semibold text-foreground">{t('foot.' + player.preferred_foot)}</div>
                </div>
              )}
              {player.jersey_number && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs">{t('players.jersey')}</div>
                  <div className="font-semibold text-foreground">#{player.jersey_number}</div>
                </div>
              )}
              <div className="rounded-lg bg-background px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.nationality')}</div>
                <div className="font-semibold text-foreground">{player.nationality ? t('nationality.' + player.nationality) : '-'}</div>
              </div>
              {totalViews > 0 && (
                <div className="rounded-lg bg-background px-3 py-2 border border-border">
                  <div className="text-foreground-muted text-xs flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('players.scoutViews')}
                  </div>
                  <div className="font-semibold text-foreground">{totalViews}</div>
                  {recentViews > 0 && (
                    <div className="mt-0.5 text-[11px] text-foreground-muted">
                      {recentViews} {t('players.thisWeek')}
                      {previousViews > 0 ? (() => {
                        const pct = Math.round(((recentViews - previousViews) / previousViews) * 100)
                        return (
                          <span className={pct >= 0 ? 'text-accent' : 'text-red-400'}>
                            {' '}({pct >= 0 ? '+' : ''}{pct}%)
                          </span>
                        )
                      })() : (
                        <span className="text-accent"> ({t('players.new')})</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills + Season Stats grid */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Radar chart */}
        {skills && (
          <div className="card">
            <h3 className="section-header mb-4">{t('players.skills')}</h3>
            <RadarChart skills={skills} labels={['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(k => t('skills.' + k))} />
          </div>
        )}

        {/* Season stats table */}
        {seasonStats.length > 0 && (
          <div className="card lg:col-span-2">
            <h3 className="section-header mb-4">{t('players.seasonStats')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    <th className="pb-2 pr-4">{t('stats.season')}</th>
                    <th className="pb-2 pr-4">{t('stats.mp')}</th>
                    <th className="pb-2 pr-4">{t('stats.g')}</th>
                    <th className="pb-2 pr-4">{t('stats.a')}</th>
                    <th className="pb-2 pr-4">{t('stats.min')}</th>
                    <th className="pb-2 pr-4">{t('stats.passPercent')}</th>
                    <th className="pb-2 pr-4">{t('stats.tackles')}</th>
                    <th className="pb-2">{t('stats.int')}</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonStats.map((s) => (
                    <tr key={s.season} className="table-row-hover border-b border-border/50">
                      <td className="py-2 pr-4 font-medium text-foreground">{s.season}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{s.matches_played}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{s.goals}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{s.assists}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{s.minutes_played}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{s.pass_accuracy ? `${s.pass_accuracy}%` : '-'}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{s.tackles}</td>
                      <td className="py-2 text-foreground-muted">{s.interceptions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Match history */}
      {matchStats.length > 0 && (
        <div className="mt-6 card">
          <h3 className="section-header mb-4">{t('players.matchHistory')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  <th className="pb-2 pr-4">{t('stats.match')}</th>
                  <th className="pb-2 pr-4">{t('stats.date')}</th>
                  <th className="pb-2 pr-4">{t('stats.min')}</th>
                  <th className="pb-2 pr-4">{t('stats.g')}</th>
                  <th className="pb-2 pr-4">{t('stats.a')}</th>
                  <th className="pb-2 pr-4">{t('stats.rating')}</th>
                  <th className="pb-2 pr-4">{t('stats.passPercent')}</th>
                  <th className="pb-2 pr-4">{t('stats.dist')}</th>
                  <th className="pb-2">{t('stats.speed')}</th>
                </tr>
              </thead>
              <tbody>
                {matchStats.map((ms, i) => {
                  const m = ms.match
                  const homeClub = m ? unwrapRelation(m.home_club) : null
                  const awayClub = m ? unwrapRelation(m.away_club) : null
                  const homeName = homeClub ? (lang === 'ka' ? homeClub.name_ka : homeClub.name) : null
                  const awayName = awayClub ? (lang === 'ka' ? awayClub.name_ka : awayClub.name) : null
                  const matchLabel = homeName && awayName
                    ? `${homeName} vs ${awayName}`
                    : t('stats.match')
                  return (
                    <tr key={i} className="table-row-hover border-b border-border/50">
                      <td className="py-2 pr-4">
                        {m?.slug ? (
                          <Link href={`/matches/${m.slug}`} className="text-accent hover:underline">
                            {matchLabel}
                          </Link>
                        ) : matchLabel}
                      </td>
                      <td className="py-2 pr-4 text-foreground-muted">{m?.match_date ? format(new Date(m.match_date), 'MMM d, yyyy') : '-'}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ms.minutes_played ?? '-'}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{ms.goals}</td>
                      <td className="py-2 pr-4 font-semibold text-foreground">{ms.assists}</td>
                      <td className="py-2 pr-4">
                        {ms.rating ? (
                          <span className={`font-bold ${Number(ms.rating) >= 7.5 ? 'text-accent' : Number(ms.rating) >= 6 ? 'text-foreground' : 'text-foreground-muted'}`}>
                            {ms.rating}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 pr-4 text-foreground-muted">{ms.pass_accuracy ? `${ms.pass_accuracy}%` : '-'}</td>
                      <td className="py-2 pr-4 text-foreground-muted">{ms.distance_km ? `${ms.distance_km}km` : '-'}</td>
                      <td className="py-2 text-foreground-muted">{ms.top_speed_kmh ? `${ms.top_speed_kmh}km/h` : '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Career history */}
      {clubHistory.length > 0 && (
        <div className="mt-6 card">
          <h3 className="section-header mb-4">{t('players.careerHistory')}</h3>
          <div className="space-y-3">
            {clubHistory.map((entry) => {
              const entryClubName = entry.club
                ? (lang === 'ka' ? entry.club.name_ka : entry.club.name)
                : t('matches.unknown')
              return (
                <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="h-8 w-1 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    {entry.club?.slug ? (
                      <Link href={`/clubs/${entry.club.slug}`} className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                        {entryClubName}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">{entryClubName}</span>
                    )}
                    <p className="text-xs text-foreground-muted">
                      {format(new Date(entry.joined_at), 'MMM d, yyyy')} &mdash; {entry.left_at ? format(new Date(entry.left_at), 'MMM d, yyyy') : t('players.present')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
