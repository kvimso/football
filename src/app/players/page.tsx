import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge } from '@/lib/utils'
import { PlayerCard } from '@/components/player/PlayerCard'
import { FilterPanel } from '@/components/forms/FilterPanel'
import { AGE_RANGE_MAP } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Player Directory | Georgian Football Talent Platform',
  description:
    'Browse and discover Georgian youth football talent. Filter by position, age, club, and preferred foot.',
}

interface PlayersPageProps {
  searchParams: Promise<{
    position?: string
    age?: string
    club?: string
    foot?: string
    q?: string
  }>
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams
  const { position, age, club, foot, q } = params

  const supabase = await createClient()
  const { t } = await getServerT()

  // Fetch clubs for filter dropdown
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name, name_ka')
    .order('name')

  if (clubsError) console.error('Failed to fetch clubs:', clubsError.message)

  // Build player query
  let query = supabase
    .from('players')
    .select(
      `
      slug,
      name,
      name_ka,
      position,
      date_of_birth,
      height_cm,
      preferred_foot,
      is_featured,
      photo_url,
      club:clubs!players_club_id_fkey (
        name,
        name_ka
      ),
      season_stats:player_season_stats (
        goals,
        assists,
        matches_played
      )
    `
    )
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('name')

  // Apply filters
  if (position) {
    query = query.eq('position', position)
  }

  if (club) {
    query = query.eq('club_id', club)
  }

  if (foot) {
    query = query.eq('preferred_foot', foot)
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,name_ka.ilike.%${q}%`)
  }

  const { data: players, error: playersError } = await query

  if (playersError) console.error('Failed to fetch players:', playersError.message)

  // Filter by age client-side (DOB-based age ranges need date calculation)
  let filteredPlayers = players ?? []

  if (age && AGE_RANGE_MAP[age]) {
    const { min, max } = AGE_RANGE_MAP[age]
    filteredPlayers = filteredPlayers.filter((p) => {
      const playerAge = calculateAge(p.date_of_birth)
      return playerAge >= min && playerAge <= max
    })
  }

  // Map to card props — pick the latest season stats
  const playerCards = filteredPlayers.map((p) => {
    const stats = Array.isArray(p.season_stats) ? p.season_stats[0] : p.season_stats
    return {
      ...p,
      club: Array.isArray(p.club) ? p.club[0] : p.club,
      season_stats: stats ?? null,
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('players.title')}</h1>
        <p className="mt-1 text-foreground-muted">
          {t('players.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <FilterPanel clubs={clubs ?? []} />

      {/* Results count */}
      <p className="mt-6 mb-4 text-sm text-foreground-muted">
        {playerCards.length} {playerCards.length !== 1 ? t('players.playerPlural') : t('players.player')} {t('common.found')}
      </p>

      {/* Player grid */}
      {playerCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playerCards.map((player) => (
            <PlayerCard key={player.slug} player={player} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-foreground-muted/30 mb-4">&#9917;</div>
          <p className="text-lg font-medium text-foreground-muted">
            {t('players.noPlayers')}
          </p>
          <p className="mt-1 text-sm text-foreground-muted/70">
            {t('players.noPlayersHint')}
          </p>
        </div>
      )}
    </div>
  )
}
