'use client'

import { useState, useCallback } from 'react'
import { useLang } from '@/hooks/useLang'
import { AISearchBar } from './AISearchBar'
import { AIFilterTags } from './AIFilterTags'
import { PlayerCard } from './PlayerCard'
import { FilterPanel } from '@/components/forms/FilterPanel'
import type { AISearchFilters } from '@/lib/ai-search/types'
import type { Position, PlayerStatus } from '@/lib/types'

interface Club {
  id: string
  name: string
  name_ka: string
}

interface PlayerCardData {
  id: string
  slug: string
  name: string
  name_ka: string
  position: Position
  date_of_birth: string
  height_cm: number | null
  preferred_foot: string | null
  is_featured: boolean | null
  photo_url: string | null
  status: PlayerStatus
  club: { name: string; name_ka: string } | null
  season_stats: {
    goals: number | null
    assists: number | null
    matches_played: number | null
  } | null
}

interface PlayerDirectoryClientProps {
  clubs: Club[]
  serverPlayers: PlayerCardData[]
  viewCountMap: Record<string, number>
  watchedPlayerIds: string[]
  /** Pre-rendered pagination from the server component */
  pagination: React.ReactNode
  totalCount: number
}

/** Map raw AI search player result to PlayerCardData */
function mapAIPlayerToCard(p: Record<string, unknown>): PlayerCardData {
  const club = p.club as { name: string; name_ka: string } | null
  const seasonStatsArr = Array.isArray(p.season_stats) ? p.season_stats : []
  const latestStats = seasonStatsArr.sort(
    (a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.season ?? '').localeCompare(String(a.season ?? ''))
  )[0] as Record<string, unknown> | undefined

  return {
    id: String(p.id ?? ''),
    slug: String(p.slug ?? ''),
    name: String(p.name ?? ''),
    name_ka: String(p.name_ka ?? ''),
    position: (p.position ?? 'MID') as Position,
    date_of_birth: String(p.date_of_birth ?? ''),
    height_cm: typeof p.height_cm === 'number' ? p.height_cm : null,
    preferred_foot: typeof p.preferred_foot === 'string' ? p.preferred_foot : null,
    is_featured: typeof p.is_featured === 'boolean' ? p.is_featured : null,
    photo_url: typeof p.photo_url === 'string' ? p.photo_url : null,
    status: (p.status ?? 'active') as PlayerStatus,
    club,
    season_stats: latestStats
      ? {
          goals: typeof latestStats.goals === 'number' ? latestStats.goals : null,
          assists: typeof latestStats.assists === 'number' ? latestStats.assists : null,
          matches_played: typeof latestStats.matches_played === 'number' ? latestStats.matches_played : null,
        }
      : null,
  }
}

export function PlayerDirectoryClient({
  clubs,
  serverPlayers,
  viewCountMap,
  watchedPlayerIds,
  pagination,
  totalCount,
}: PlayerDirectoryClientProps) {
  const { t } = useLang()

  // AI search state
  const [aiPlayers, setAiPlayers] = useState<PlayerCardData[] | null>(null)
  const [aiFilters, setAiFilters] = useState<AISearchFilters | null>(null)

  const isAIActive = aiPlayers !== null

  const handleSearchResults = useCallback(
    (players: Array<Record<string, unknown>>, filters: AISearchFilters) => {
      setAiPlayers(players.map(mapAIPlayerToCard))
      setAiFilters(filters)
    },
    []
  )

  const handleClearSearch = useCallback(() => {
    setAiPlayers(null)
    setAiFilters(null)
  }, [])

  const handleRemoveFilter = useCallback(
    async (key: keyof AISearchFilters) => {
      if (!aiFilters) return

      const updated = { ...aiFilters }
      delete updated[key]

      // If sort_by removed, also remove sort_direction
      if (key === 'sort_by') delete updated.sort_direction

      // If no filters remain, exit AI mode
      const remaining = Object.values(updated).filter((v) => v !== undefined)
      if (remaining.length === 0) {
        handleClearSearch()
        return
      }

      setAiFilters(updated)

      // Re-query API with remaining filters (pass them directly to skip Claude)
      try {
        const res = await fetch('/api/players/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: '__requery__', filters: updated }),
        })
        if (res.ok) {
          const data = await res.json()
          setAiPlayers(data.data.players.map(mapAIPlayerToCard))
          setAiFilters(data.data.filters_applied)
        }
      } catch {
        // Fallback: just remove the tag client-side, keep existing results
      }
    },
    [aiFilters, handleClearSearch]
  )

  const displayPlayers = isAIActive ? aiPlayers : serverPlayers
  const displayCount = isAIActive ? aiPlayers.length : totalCount

  return (
    <>
      {/* AI Search Bar */}
      <AISearchBar
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
        isActive={isAIActive}
      />

      {/* AI Filter Tags */}
      {isAIActive && aiFilters && (
        <AIFilterTags
          filters={aiFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearSearch}
        />
      )}

      {/* Regular Filters — dimmed during AI mode */}
      <div className={isAIActive ? 'opacity-40 pointer-events-none' : ''}>
        <FilterPanel clubs={clubs} />
      </div>

      {/* Results header */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground-muted" aria-live="polite">
          <span className="font-semibold text-foreground">{displayCount}</span>{' '}
          {displayCount !== 1 ? t('players.playerPlural') : t('players.player')}{' '}
          {t('common.found')}
        </p>
        {isAIActive && (
          <button
            onClick={handleClearSearch}
            className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors underline"
          >
            {t('aiSearch.clear')}
          </button>
        )}
      </div>

      {/* Player grid */}
      {displayPlayers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {displayPlayers.map((player) => (
            <PlayerCard
              key={player.slug}
              player={player}
              viewCount={viewCountMap[player.id] ?? 0}
              isWatched={watchedPlayerIds.includes(player.id)}
            />
          ))}
        </div>
      ) : isAIActive ? (
        /* AI empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-purple-400/20 mb-4">&#128269;</div>
          <p className="text-lg font-medium text-foreground-muted">
            {t('aiSearch.noResults')}
          </p>
          <p className="mt-1 text-sm text-foreground-muted/70">
            {t('aiSearch.noResultsHint')}
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"
          >
            {t('aiSearch.clear')}
          </button>
        </div>
      ) : (
        /* Normal empty state */
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

      {/* Pagination — only in normal mode */}
      {!isAIActive && pagination}
    </>
  )
}
