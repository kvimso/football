import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge } from '@/lib/utils'
import { RadarChart } from '@/components/player/RadarChart'
import { PlayerProfileClient } from '@/components/player/PlayerProfileClient'
import { ShortlistButton } from '@/components/player/ShortlistButton'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'

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
  const { t } = await getServerT()

  const { data: player, error } = await supabase
    .from('players')
    .select(`
      id, name, name_ka, slug, date_of_birth, nationality, position,
      preferred_foot, height_cm, weight_kg, photo_url, jersey_number,
      scouting_report, scouting_report_ka, status, is_featured,
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
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !player) notFound()

  // Check if user is logged in and has shortlisted/contacted this player
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) console.error('Failed to get user:', authError.message)

  let isShortlisted = false
  let hasContactRequest = false

  if (user) {
    const { data: shortlistEntry, error: slError } = await supabase
      .from('shortlists')
      .select('id')
      .eq('scout_id', user.id)
      .eq('player_id', player.id)
      .maybeSingle()

    if (slError) console.error('Failed to check shortlist:', slError.message)
    isShortlisted = !!shortlistEntry

    const { data: contactEntry, error: crError } = await supabase
      .from('contact_requests')
      .select('id')
      .eq('scout_id', user.id)
      .eq('player_id', player.id)
      .maybeSingle()

    if (crError) console.error('Failed to check contact request:', crError.message)
    hasContactRequest = !!contactEntry
  }

  const age = calculateAge(player.date_of_birth)
  const club = Array.isArray(player.club) ? player.club[0] : player.club
  const skills = Array.isArray(player.skills) ? player.skills[0] : player.skills
  const seasonStats = Array.isArray(player.season_stats) ? player.season_stats : player.season_stats ? [player.season_stats] : []
  const matchStats = (Array.isArray(player.match_stats) ? player.match_stats : []).map((ms) => ({
    ...ms,
    match: Array.isArray(ms.match) ? ms.match[0] : ms.match,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link href="/players" className="mb-6 inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition-colors">
        &larr; {t('players.backToPlayers')}
      </Link>

      {/* Player header */}
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:gap-10">
        {/* Photo */}
        <div className="flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-background-secondary border border-border">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-6xl font-bold text-foreground-muted/20">{player.name.charAt(0)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <PlayerProfileClient player={{
            name: player.name,
            name_ka: player.name_ka,
            position: player.position,
            is_featured: player.is_featured,
            scouting_report: player.scouting_report,
            scouting_report_ka: player.scouting_report_ka,
            club_name: club?.name ?? null,
            club_name_ka: club?.name_ka ?? null,
            club_slug: club?.slug ?? null,
          }} />

          {/* Action buttons */}
          {user && (
            <div className="mt-4 flex gap-3">
              <ShortlistButton playerId={player.id} isShortlisted={isShortlisted} size="md" />
              {!hasContactRequest ? (
                <ContactRequestForm playerId={player.id} />
              ) : (
                <span className="rounded-lg bg-accent-muted/30 px-4 py-2 text-sm font-medium text-accent">
                  {t('players.requestSent')}
                </span>
              )}
            </div>
          )}
          {!user && (
            <div className="mt-4">
              <Link href="/login" className="btn-primary text-sm">
                {t('players.signInToSave')}
              </Link>
            </div>
          )}

          {/* Meta grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
              <div className="text-foreground-muted text-xs">{t('players.age')}</div>
              <div className="font-semibold text-foreground">{age}</div>
            </div>
            {player.height_cm && (
              <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.height')}</div>
                <div className="font-semibold text-foreground">{player.height_cm} cm</div>
              </div>
            )}
            {player.weight_kg && (
              <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.weight')}</div>
                <div className="font-semibold text-foreground">{player.weight_kg} kg</div>
              </div>
            )}
            {player.preferred_foot && (
              <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.foot')}</div>
                <div className="font-semibold text-foreground">{player.preferred_foot}</div>
              </div>
            )}
            {player.jersey_number && (
              <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
                <div className="text-foreground-muted text-xs">{t('players.jersey')}</div>
                <div className="font-semibold text-foreground">#{player.jersey_number}</div>
              </div>
            )}
            <div className="rounded-lg bg-background-secondary px-3 py-2 border border-border">
              <div className="text-foreground-muted text-xs">{t('players.nationality')}</div>
              <div className="font-semibold text-foreground">{player.nationality}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills + Season Stats grid */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Radar chart */}
        {skills && (
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t('players.skills')}</h3>
            <RadarChart skills={skills} />
          </div>
        )}

        {/* Season stats table */}
        {seasonStats.length > 0 && (
          <div className="card lg:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-foreground">{t('players.seasonStats')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-foreground-muted">
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
                    <tr key={s.season} className="border-b border-border/50">
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
          <h3 className="mb-4 text-lg font-semibold text-foreground">{t('players.matchHistory')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-foreground-muted">
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
                  const homeClub = m ? (Array.isArray(m.home_club) ? m.home_club[0] : m.home_club) : null
                  const awayClub = m ? (Array.isArray(m.away_club) ? m.away_club[0] : m.away_club) : null
                  const matchLabel = homeClub && awayClub
                    ? `${homeClub.name} vs ${awayClub.name}`
                    : t('stats.match')
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        {m?.slug ? (
                          <Link href={`/matches/${m.slug}`} className="text-accent hover:underline">
                            {matchLabel}
                          </Link>
                        ) : matchLabel}
                      </td>
                      <td className="py-2 pr-4 text-foreground-muted">{m?.match_date ?? '-'}</td>
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
    </div>
  )
}
