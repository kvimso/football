'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import type { PlayerSearchResult, Position } from '@/lib/types'
import type { Lang } from '@/lib/translations'

interface PlayerSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (player: PlayerSearchResult) => void
  lang: Lang
  t: (key: string) => string
}

export function PlayerSearchModal({ isOpen, onClose, onSelect, lang, t }: PlayerSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlayerSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Escape key to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const doSearch = useDebouncedCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q.trim())}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.players)
      }
    } catch {
      // Silently handle search errors
    } finally {
      setIsSearching(false)
    }
  }, 300)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    doSearch(val)
  }, [doSearch])

  const handleSelect = useCallback((player: PlayerSearchResult) => {
    onSelect(player)
    onClose()
  }, [onSelect, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('chat.addPlayerRef')}
        className="w-full max-w-md rounded-xl border border-border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{t('chat.addPlayerRef')}</h3>
          <button onClick={onClose} aria-label={t('aria.closeModal')} className="text-foreground-muted hover:text-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="border-b border-border px-4 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder={t('chat.searchPlayers')}
              className="input w-full pl-9"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          )}

          {!isSearching && query.length > 0 && results.length === 0 && (
            <div className="py-8 text-center text-sm text-foreground-muted">
              {t('common.noResults')}
            </div>
          )}

          {!isSearching && query.length === 0 && (
            <div className="py-8 text-center text-sm text-foreground-muted">
              {t('chat.searchPlayersHint')}
            </div>
          )}

          {results.map((player) => {
            const displayName = lang === 'ka' && player.name_ka ? player.name_ka : player.name
            const clubName = lang === 'ka' && player.club_name_ka ? player.club_name_ka : player.club_name
            const posClass = player.position ? POSITION_COLOR_CLASSES[player.position as Position] : ''

            return (
              <button
                key={player.id}
                onClick={() => handleSelect(player)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-background-secondary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background-secondary">
                  {player.photo_url ? (
                    <Image
                      src={player.photo_url}
                      alt={displayName}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                    {player.position && (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${posClass}`}>
                        {player.position}
                      </span>
                    )}
                  </div>
                  {clubName && (
                    <p className="truncate text-xs text-foreground-muted">{clubName}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
