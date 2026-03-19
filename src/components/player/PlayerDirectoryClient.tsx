'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { AISearchBar } from './AISearchBar'
import { AIFilterTags } from './AIFilterTags'
import { PlayerCard } from './PlayerCard'
import { PlayerListRow } from './PlayerListRow'
import { FilterPanel } from '@/components/forms/FilterPanel'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { calculateAge } from '@/lib/utils'
import type { AISearchFilters } from '@/lib/ai-search/types'
import type { PlayerBrowseData, ViewMode, Position, PlayerStatus } from '@/lib/types'

interface Club {
  id: string
  name: string
  name_ka: string
}

interface PlayerDirectoryClientProps {
  clubs: Club[]
  serverPlayers: PlayerBrowseData[]
  viewCountMap: Record<string, number>
  watchedPlayerIds: string[]
  /** Pre-rendered pagination from the server component */
  pagination: React.ReactNode
  totalCount: number
  featuredPlayer: PlayerBrowseData | null
}

/** Map raw AI search player result to PlayerBrowseData */
function mapAIPlayerToCard(p: Record<string, unknown>): PlayerBrowseData {
  const club = p.club as { name: string; name_ka: string } | null

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
  }
}

export function PlayerDirectoryClient({
  clubs,
  serverPlayers,
  viewCountMap,
  watchedPlayerIds,
  pagination,
  totalCount,
  featuredPlayer,
}: PlayerDirectoryClientProps) {
  const { t, lang } = useLang()

  // View mode from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid'
    return (localStorage.getItem('playerViewMode') as ViewMode) ?? 'grid'
  })

  // AI search state
  const [aiPlayers, setAiPlayers] = useState<PlayerBrowseData[] | null>(null)
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

  function handleToggleView(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem('playerViewMode', mode)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const displayPlayers = isAIActive ? aiPlayers : serverPlayers
  const displayCount = isAIActive ? aiPlayers.length : totalCount

  // Featured banner data
  const featuredName = featuredPlayer
    ? lang === 'ka'
      ? featuredPlayer.name_ka
      : featuredPlayer.name
    : ''
  const featuredClubName = featuredPlayer?.club
    ? lang === 'ka'
      ? featuredPlayer.club.name_ka
      : featuredPlayer.club.name
    : null
  const featuredAge = featuredPlayer ? calculateAge(featuredPlayer.date_of_birth) : ''
  const featuredPosClasses = featuredPlayer
    ? (POSITION_COLOR_CLASSES[featuredPlayer.position] ?? 'bg-primary/20 text-primary')
    : ''

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

      {/* Results header with count + view toggle */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <p className="text-sm text-foreground-muted" aria-live="polite">
          <span className="font-semibold text-foreground">{displayCount}</span>{' '}
          {displayCount !== 1 ? t('players.playerPlural') : t('players.player')} {t('common.found')}
        </p>

        <div className="flex items-center gap-1">
          {isAIActive && (
            <button
              onClick={handleClearSearch}
              className="mr-2 text-xs text-primary/70 hover:text-primary transition-colors underline"
            >
              {t('aiSearch.clear')}
            </button>
          )}
          {/* Grid toggle */}
          <button
            onClick={() => handleToggleView('grid')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            aria-label={t('players.viewGrid')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          {/* List toggle */}
          <button
            onClick={() => handleToggleView('list')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-muted hover:text-foreground'
            }`}
            aria-label={t('players.viewList')}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
              <rect x="1" y="2" width="14" height="2" rx="0.5" />
              <rect x="1" y="7" width="14" height="2" rx="0.5" />
              <rect x="1" y="12" width="14" height="2" rx="0.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Featured player banner — hidden during AI search */}
      {featuredPlayer && !isAIActive && (
        <Link
          href={`/players/${featuredPlayer.slug}`}
          className="group relative mb-6 flex items-center gap-6 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary-muted to-surface p-5 transition-all hover:shadow-md"
        >
          {/* Photo — 80px */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-elevated">
            {featuredPlayer.photo_url ? (
              <Image
                src={featuredPlayer.photo_url}
                alt={featuredName}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <PlayerSilhouette size="sm" className="scale-125 text-foreground-muted/20" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {t('players.featured')}
            </span>
            <h3 className="mt-1 truncate text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {featuredName}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-foreground-muted">
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${featuredPosClasses}`}
              >
                {featuredPlayer.position}
              </span>
              {featuredClubName && <span>{featuredClubName}</span>}
              <span>·</span>
              <span>{featuredAge}</span>
            </div>
          </div>
          {/* Chevron */}
          <svg
            className="h-5 w-5 shrink-0 text-foreground-muted/40 group-hover:text-primary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* Player grid or list */}
      {displayPlayers.length > 0 ? (
        viewMode === 'grid' ? (
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
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* List header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
              <span className="w-8" /> {/* Photo spacer */}
              <span className="flex-1">{t('players.name')}</span>
              <span className="w-12 text-center">{t('players.position')}</span>
              <span className="w-8 text-center">{t('players.age')}</span>
              <span className="hidden w-28 sm:block">{t('players.club')}</span>
              <span className="w-8 text-center">{t('players.goals')}</span>
              <span className="hidden w-8 text-center sm:block">{t('players.assists')}</span>
              <span className="hidden w-8 text-center md:block">{t('players.matches')}</span>
              <span className="w-6" /> {/* Star spacer */}
            </div>
            {/* List rows */}
            {displayPlayers.map((player) => (
              <PlayerListRow
                key={player.slug}
                player={player}
                viewCount={viewCountMap[player.id] ?? 0}
                isWatched={watchedPlayerIds.includes(player.id)}
              />
            ))}
          </div>
        )
      ) : isAIActive ? (
        /* AI empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-primary/20 mb-4">&#128269;</div>
          <p className="text-lg font-medium text-foreground-muted">{t('aiSearch.noResults')}</p>
          <p className="mt-1 text-sm text-foreground-muted/70">{t('aiSearch.noResultsHint')}</p>
          <button
            onClick={handleClearSearch}
            className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {t('aiSearch.clear')}
          </button>
        </div>
      ) : (
        /* Normal empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl text-foreground-muted/30 mb-4">&#9917;</div>
          <p className="text-lg font-medium text-foreground-muted">{t('players.noPlayers')}</p>
          <p className="mt-1 text-sm text-foreground-muted/70">{t('players.noPlayersHint')}</p>
        </div>
      )}

      {/* Pagination — only in normal mode */}
      {!isAIActive && pagination}
    </>
  )
}
