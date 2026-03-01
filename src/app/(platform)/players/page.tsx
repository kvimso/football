import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { calculateAge, unwrapRelation, escapePostgrestValue } from '@/lib/utils'
import type { Position, PlayerStatus } from '@/lib/types'
import { PlayerCard } from '@/components/player/PlayerCard'
import { FilterPanel } from '@/components/forms/FilterPanel'

const PAGE_SIZE = 24

export const metadata: Metadata = {
  title: 'Player Directory | Georgian Football Talent Platform',
  description:
    'Browse and discover Georgian youth football talent. Filter by position, age, club, and preferred foot.',
}

interface PlayersPageProps {
  searchParams: Promise<{
    position?: string
    age_min?: string
    age_max?: string
    club?: string
    foot?: string
    q?: string
    status?: string
    sort?: string
    page?: string
    height_min?: string
    height_max?: string
    weight_min?: string
    weight_max?: string
    goals_min?: string
    assists_min?: string
    matches_min?: string
    pass_acc_min?: string
  }>
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams
  const { position, age_min, age_max, club, foot, q, status, sort, height_min, height_max, weight_min, weight_max, goals_min, assists_min, matches_min, pass_acc_min } = params
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
      id,
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
        matches_played,
        pass_accuracy
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

  // Apply filters — multi-select position
  if (position) {
    const positions = position.split(',').filter(Boolean)
    if (positions.length > 0) {
      query = query.in('position', positions)
    }
  }

  // Multi-select club
  if (club) {
    const clubIds = club.split(',').filter(Boolean)
    if (clubIds.length > 0) {
      query = query.in('club_id', clubIds)
    }
  }

  if (foot) {
    query = query.eq('preferred_foot', foot)
  }

  if (q) {
    const sanitized = escapePostgrestValue(q)
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%`)
    }
  }

  // Height filter — DB-level
  if (height_min) {
    const hMin = parseInt(height_min, 10)
    if (!isNaN(hMin)) {
      query = query.gte('height_cm', hMin)
    }
  }
  if (height_max) {
    const hMax = parseInt(height_max, 10)
    if (!isNaN(hMax)) {
      query = query.lte('height_cm', hMax)
    }
  }

  // Weight filter — DB-level
  if (weight_min) {
    const wMin = parseInt(weight_min, 10)
    if (!isNaN(wMin)) {
      query = query.gte('weight_kg', wMin)
    }
  }
  if (weight_max) {
    const wMax = parseInt(weight_max, 10)
    if (!isNaN(wMax)) {
      query = query.lte('weight_kg', wMax)
    }
  }

  // Pagination — when age filter or most_viewed sort is active we can't paginate at DB level
  // because age is calculated client-side from DOB and most_viewed needs client-side reordering
  const hasAgeFilter = !!(age_min || age_max)
  const hasStatFilter = !!(goals_min || assists_min || matches_min || pass_acc_min)
  const needsClientPagination = hasAgeFilter || hasStatFilter || sort === 'most_viewed'
  if (!needsClientPagination) {
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
    let minAge = age_min ? parseInt(age_min, 10) : 0
    let maxAge = age_max ? parseInt(age_max, 10) : 99
    // Swap if inverted
    if (minAge > maxAge) [minAge, maxAge] = [maxAge, minAge]
    filteredPlayers = filteredPlayers.filter((p) => {
      const playerAge = calculateAge(p.date_of_birth)
      return playerAge >= minAge && playerAge <= maxAge
    })
  }

  // Filter by stat minimums — client-side (latest season stats)
  if (hasStatFilter) {
    const minGoals = goals_min ? parseInt(goals_min, 10) : 0
    const minAssists = assists_min ? parseInt(assists_min, 10) : 0
    const minMatches = matches_min ? parseInt(matches_min, 10) : 0
    const minPassAcc = pass_acc_min ? parseInt(pass_acc_min, 10) : 0

    filteredPlayers = filteredPlayers.filter((p) => {
      const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
      const latest = statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0]
      if (!latest) return false // No stats → excluded when stat filters are active
      if (minGoals && (latest.goals ?? 0) < minGoals) return false
      if (minAssists && (latest.assists ?? 0) < minAssists) return false
      if (minMatches && (latest.matches_played ?? 0) < minMatches) return false
      if (minPassAcc && (latest.pass_accuracy ?? 0) < minPassAcc) return false
      return true
    })
  }

  // Fetch view counts via database aggregation (RPC replaces unbounded 10k-row fetch)
  let viewCountMap = new Map<string, number>()
  try {
    const { data: viewCounts, error: vcError } = await supabase.rpc('get_player_view_counts')
    if (vcError) {
      console.error('Failed to fetch view counts:', vcError.message)
    } else if (viewCounts) {
      viewCountMap = new Map(viewCounts.map(v => [v.player_id, Number(v.total_views)]))
    }
  } catch {
    // Silently fail — view counts are non-critical
  }

  // Map to card props — pick the latest season stats
  const allCards = filteredPlayers.map((p) => {
    const statsArr = Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []
    const stats = statsArr.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''))[0] ?? null
    return {
      ...p,
      position: p.position as Position,
      status: (p.status ?? 'active') as PlayerStatus,
      club: unwrapRelation(p.club),
      season_stats: stats ?? null,
    }
  })

  // Sort by most viewed if requested
  if (sort === 'most_viewed') {
    allCards.sort((a, b) => (viewCountMap.get(b.id) ?? 0) - (viewCountMap.get(a.id) ?? 0))
  }

  // For age-filtered / most-viewed results, paginate client-side
  const playerCards = needsClientPagination
    ? allCards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : allCards

  const total = needsClientPagination ? allCards.length : (totalCount ?? 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Build pagination URL helper
  function pageUrl(p: number) {
    const sp = new URLSearchParams()
    if (position) sp.set('position', position)
    if (age_min) sp.set('age_min', age_min)
    if (age_max) sp.set('age_max', age_max)
    if (club) sp.set('club', club)
    if (foot) sp.set('foot', foot)
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (sort) sp.set('sort', sort)
    if (height_min) sp.set('height_min', height_min)
    if (height_max) sp.set('height_max', height_max)
    if (weight_min) sp.set('weight_min', weight_min)
    if (weight_max) sp.set('weight_max', weight_max)
    if (goals_min) sp.set('goals_min', goals_min)
    if (assists_min) sp.set('assists_min', assists_min)
    if (matches_min) sp.set('matches_min', matches_min)
    if (pass_acc_min) sp.set('pass_acc_min', pass_acc_min)
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

      {/* Results header */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground-muted">
          <span className="font-semibold text-foreground">{total}</span>{' '}
          {total !== 1 ? t('players.playerPlural') : t('players.player')} {t('common.found')}
        </p>
      </div>

      {/* Player grid */}
      {playerCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playerCards.map((player) => (
            <PlayerCard key={player.slug} player={player} viewCount={viewCountMap.get(player.id) ?? 0} />
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
