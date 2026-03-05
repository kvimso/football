'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { WatchlistSidebar } from './WatchlistSidebar'
import { WatchlistPlayerRow } from './WatchlistPlayerRow'
import type { Position } from '@/lib/types'
import { POSITIONS } from '@/lib/constants'

export interface WatchlistItem {
  id: string
  player_id: string
  notes: string | null
  created_at: string | null
  player: {
    id: string
    name: string
    name_ka: string
    slug: string
    position: Position
    date_of_birth: string
    photo_url: string | null
    club: { name: string; name_ka: string } | null
  }
}

export interface Folder {
  id: string
  name: string
  created_at: string | null
}

interface Props {
  items: WatchlistItem[]
  folders: Folder[]
  tagMap: Record<string, Array<{ id: string; tag: string }>>
  folderAssignmentMap: Record<string, string[]>
}

export function WatchlistPage({ items: initialItems, folders: initialFolders, tagMap: initialTagMap, folderAssignmentMap: initialAssignMap }: Props) {
  const { t, lang } = useLang()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [items, setItems] = useState(initialItems)
  const [folders, setFolders] = useState(initialFolders)
  const [tagMap, setTagMap] = useState(initialTagMap)
  const [assignMap, setAssignMap] = useState(initialAssignMap)

  // URL param filters
  const activeFolder = searchParams.get('folder') ?? null
  const activeTags = searchParams.get('tags')?.split(',').filter(Boolean) ?? []
  const activePosition = (searchParams.get('position') as Position) ?? null
  const searchQuery = searchParams.get('q') ?? ''
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false)

  // Collect all unique tags across the user's watchlist
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const tags of Object.values(tagMap)) {
      for (const t of tags) tagSet.add(t.tag)
    }
    return Array.from(tagSet).sort()
  }, [tagMap])

  // Count players per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const [watchlistId, folderIds] of Object.entries(assignMap)) {
      // Only count items that still exist
      if (items.some(i => i.id === watchlistId)) {
        for (const fid of folderIds) {
          counts[fid] = (counts[fid] ?? 0) + 1
        }
      }
    }
    return counts
  }, [assignMap, items])

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Folder filter
      if (activeFolder === '__unfoldered') {
        if (assignMap[item.id]?.length > 0) return false
      } else if (activeFolder) {
        if (!assignMap[item.id]?.includes(activeFolder)) return false
      }

      // Position filter
      if (activePosition && POSITIONS.includes(activePosition as typeof POSITIONS[number])) {
        if (item.player.position !== activePosition) return false
      }

      // Tag filter (all selected tags must be present)
      if (activeTags.length > 0) {
        const itemTags = tagMap[item.id]?.map(t => t.tag) ?? []
        if (!activeTags.every(tag => itemTags.includes(tag))) return false
      }

      // Text search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = lang === 'ka' ? item.player.name_ka : item.player.name
        const club = item.player.club
          ? (lang === 'ka' ? item.player.club.name_ka : item.player.club.name)
          : ''
        const notes = item.notes ?? ''
        const itemTags = tagMap[item.id]?.map(t => t.tag).join(' ') ?? ''
        if (
          !name.toLowerCase().includes(q) &&
          !club.toLowerCase().includes(q) &&
          !notes.toLowerCase().includes(q) &&
          !itemTags.toLowerCase().includes(q)
        ) return false
      }

      return true
    })
  }, [items, activeFolder, activePosition, activeTags, searchQuery, tagMap, assignMap, lang])

  // Update URL params
  const setFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`/dashboard/watchlist?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const handleRemoveItem = useCallback((playerId: string) => {
    setItems(prev => prev.filter(i => i.player_id !== playerId))
  }, [])

  const handleTagAdded = useCallback((watchlistId: string, tag: { id: string; tag: string }) => {
    setTagMap(prev => ({
      ...prev,
      [watchlistId]: [...(prev[watchlistId] ?? []), tag],
    }))
  }, [])

  const handleTagRemoved = useCallback((watchlistId: string, tagId: string) => {
    setTagMap(prev => ({
      ...prev,
      [watchlistId]: (prev[watchlistId] ?? []).filter(t => t.id !== tagId),
    }))
  }, [])

  const handleFolderAssigned = useCallback((watchlistId: string, folderId: string) => {
    setAssignMap(prev => ({
      ...prev,
      [watchlistId]: [...(prev[watchlistId] ?? []).filter(f => f !== folderId), folderId],
    }))
  }, [])

  const handleFolderUnassigned = useCallback((watchlistId: string, folderId: string) => {
    setAssignMap(prev => ({
      ...prev,
      [watchlistId]: (prev[watchlistId] ?? []).filter(f => f !== folderId),
    }))
  }, [])

  const handleFolderCreated = useCallback((folder: Folder) => {
    setFolders(prev => [...prev, folder])
  }, [])

  const handleFolderDeleted = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId))
    // Remove folder from all assignments
    setAssignMap(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter(f => f !== folderId)
      }
      return next
    })
    // If this folder was active, clear the filter
    if (activeFolder === folderId) setFilter('folder', null)
  }, [activeFolder, setFilter])

  const handleFolderRenamed = useCallback((folderId: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f))
  }, [])

  const hasFilters = activeFolder || activeTags.length > 0 || activePosition || searchQuery

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl text-foreground-muted/30 mb-4">&#9734;</div>
        <p className="text-lg font-medium text-foreground-muted">{t('dashboard.noWatchlist')}</p>
        <p className="mt-1 text-sm text-foreground-muted/70">{t('dashboard.noWatchlistHint')}</p>
        <Link href="/players" className="btn-primary mt-4 text-sm">
          {t('home.browsePlayers')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setMobileShowSidebar(!mobileShowSidebar)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground-muted lg:hidden"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        {t('dashboard.folders')} ({folders.length})
      </button>

      {/* Sidebar */}
      <div className={`${mobileShowSidebar ? 'block' : 'hidden'} lg:block lg:w-56 shrink-0`}>
        <WatchlistSidebar
          folders={folders}
          folderCounts={folderCounts}
          totalCount={items.length}
          activeFolder={activeFolder}
          allTags={allTags}
          activeTags={activeTags}
          onSelectFolder={(id) => setFilter('folder', id)}
          onSelectTag={(tag) => {
            const current = activeTags.includes(tag)
              ? activeTags.filter(t => t !== tag)
              : [...activeTags, tag]
            setFilter('tags', current.length > 0 ? current.join(',') : null)
          }}
          onFolderCreated={handleFolderCreated}
          onFolderDeleted={handleFolderDeleted}
          onFolderRenamed={handleFolderRenamed}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder={t('dashboard.searchPlayers')}
              value={searchQuery}
              onChange={(e) => setFilter('q', e.target.value || null)}
              className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>

          {/* Position filter */}
          <select
            value={activePosition ?? ''}
            onChange={(e) => setFilter('position', e.target.value || null)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="">{t('dashboard.filterByPosition')}</option>
            {POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => router.replace('/dashboard/watchlist', { scroll: false })}
              className="text-xs text-accent hover:underline"
            >
              {t('dashboard.clearFilters')}
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {(activeTags.length > 0 || activeFolder) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {activeFolder && activeFolder !== '__unfoldered' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                {folders.find(f => f.id === activeFolder)?.name ?? '?'}
                <button onClick={() => setFilter('folder', null)} className="hover:text-foreground">&times;</button>
              </span>
            )}
            {activeFolder === '__unfoldered' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground-muted/10 px-2.5 py-0.5 text-xs text-foreground-muted">
                {t('dashboard.unfoldered')}
                <button onClick={() => setFilter('folder', null)} className="hover:text-foreground">&times;</button>
              </span>
            )}
            {activeTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                #{tag}
                <button
                  onClick={() => {
                    const next = activeTags.filter(t => t !== tag)
                    setFilter('tags', next.length > 0 ? next.join(',') : null)
                  }}
                  className="hover:text-foreground"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            {t('dashboard.watchlist')} ({filteredItems.length})
          </h2>
        </div>

        {/* Player list */}
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
            <p className="text-sm text-foreground-muted">{t('common.noResults')}</p>
            {hasFilters && (
              <button
                onClick={() => router.replace('/dashboard/watchlist', { scroll: false })}
                className="mt-2 text-xs text-accent hover:underline"
              >
                {t('dashboard.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <WatchlistPlayerRow
                key={item.id}
                item={item}
                tags={tagMap[item.id] ?? []}
                folderIds={assignMap[item.id] ?? []}
                folders={folders}
                onRemove={handleRemoveItem}
                onTagAdded={handleTagAdded}
                onTagRemoved={handleTagRemoved}
                onFolderAssigned={handleFolderAssigned}
                onFolderUnassigned={handleFolderUnassigned}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
