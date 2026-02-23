import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge } from '@/lib/utils'
import { PlayerCard } from '@/components/player/PlayerCard'
import { FilterPanel } from '@/components/forms/FilterPanel'
import { AGE_RANGE_MAP } from '@/lib/constants'

const PAGE_SIZE = 24

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
    status?: string
    page?: string
  }>
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams
  const { position, age, club, foot, q, status } = params
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const supabase = await createClient()
  const { t } = await getServerT()

  // Fetch clubs for filter dropdown
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name, name_ka')
    .order('name')

  if (clubsError) console.error('Failed to fetch clubs:', clubsError.message)

  // Build player query with count
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
      status,
      club:clubs!players_club_id_fkey (
        name,
        name_ka
      ),
      season_stats:player_season_stats (
        season,
        goals,
        assists,
        matches_played
      )
    `,
      { count: 'exact' }
    )
    .order('is_featured', { ascending: false })
    .order('name')

  // Filter by status (default: show both active and free_agent)
  if (status === 'active') {
    query = query.eq('status', 'active')
  } else if (status === 'free_agent') {
    query = query.eq('status', 'free_agent')
  } else {
    query = query.in('status', ['active', 'free_agent'])
  }

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
    const sanitized = q.replace(/[,.()"\\]/g, '')
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%`)
    }
  }

  // Pagination — when age filter is active we can't paginate at DB level
  // because age is calculated client-side from DOB
  const hasAgeFilter = age && AGE_RANGE_MAP[age]
  if (!hasAgeFilter) {
    const from = (page - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)
  } else {
    query = query.limit(500)
  }

  const { data: players, error: playersError, count: totalCount } = await query

  if (playersError) console.error('Failed to fetch players:', playersError.message)

  // Filter by age client-side (DOB-based age ranges need date calculation)
  let filteredPlayers = players ?? []

  if (hasAgeFilter) {
    const { min, max } = AGE_RANGE_MAP[age]
    filteredPlayers = filteredPlayers.filter((p) => {
      const playerAge = calculateAge(p.date_of_birth)
      return playerAge >= min && playerAge <= max
    })
  }

  // Map to card props — pick the latest season stats
  const allCards = filteredPlayers.map((p) => {
    const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
    const stats = statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null
    return {
      ...p,
      club: Array.isArray(p.club) ? p.club[0] : p.club,
      season_stats: stats ?? null,
      status: p.status ?? 'active',
    }
  })

  // For age-filtered results, paginate client-side
  const playerCards = hasAgeFilter
    ? allCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : allCards

  const total = hasAgeFilter ? allCards.length : (totalCount ?? 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Build pagination URL helper
  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (position) sp.set('position', position)
    if (age) sp.set('age', age)
    if (club) sp.set('club', club)
    if (foot) sp.set('foot', foot)
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/players${qs ? `?${qs}` : ''}`
  }

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
        {total} {total !== 1 ? t('players.playerPlural') : t('players.player')} {t('common.found')}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={pageUrl(page - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              &larr;
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number
            if (totalPages <= 7) {
              p = i + 1
            } else if (page <= 4) {
              p = i + 1
            } else if (page >= totalPages - 3) {
              p = totalPages - 6 + i
            } else {
              p = page - 3 + i
            }
            return (
              <Link
                key={p}
                href={pageUrl(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {p}
              </Link>
            )
          })}
          {page < totalPages && (
            <Link
              href={pageUrl(page + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
