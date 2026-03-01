'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '@/hooks/useLang'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import type { Position } from '@/lib/types'

interface SearchResult {
  slug: string
  name: string
  name_ka: string
  position: string
  club_name: string | null
  club_name_ka: string | null
}

interface PlayerSearchSelectProps {
  value: string
  disabledSlug?: string
  onSelect: (slug: string) => void
  /** Pre-fetched label for the currently selected player */
  selectedLabel?: string
}

export function PlayerSearchSelect({ value, disabledSlug, onSelect, selectedLabel }: PlayerSearchSelectProps) {
  const { t, lang } = useLang()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '15' })
      if (q) params.set('q', q)
      const res = await fetch(`/api/players/search?${params.toString()}`)
      const data = await res.json()
      setResults(data.players ?? [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const debouncedSearch = useDebouncedCallback((q: string) => {
    search(q)
  }, 300)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const displayLabel = value ? (selectedLabel ?? value) : ''

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={isOpen ? query : displayLabel}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          debouncedSearch(e.target.value)
        }}
        onFocus={() => {
          setIsOpen(true)
          if (!results.length) {
            // Load initial results on focus (empty string returns first N players)
            search('')
          }
        }}
        placeholder={t('dashboard.selectPlayers')}
        className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors"
      />
      {value && (
        <button
          onClick={() => {
            onSelect('')
            setQuery('')
            setResults([])
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
          aria-label={t('players.clearFilters')}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-background-secondary shadow-lg">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-foreground-muted">{t('common.loading')}</div>
          )}
          {!isLoading && results.length === 0 && query.length > 0 && (
            <div className="px-3 py-2 text-sm text-foreground-muted">{t('common.noResults')}</div>
          )}
          {results.map((p) => {
            const name = lang === 'ka' ? p.name_ka : p.name
            const club = lang === 'ka' ? p.club_name_ka : p.club_name
            const isDisabled = p.slug === disabledSlug
            return (
              <button
                key={p.slug}
                disabled={isDisabled}
                onClick={() => {
                  onSelect(p.slug)
                  setQuery('')
                  setIsOpen(false)
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  isDisabled
                    ? 'text-foreground-muted/50 cursor-not-allowed'
                    : 'text-foreground hover:bg-accent/10'
                }`}
              >
                <span className="font-medium">{name}</span>
                <span className="ml-1.5 text-foreground-muted">({p.position as Position})</span>
                {club && <span className="ml-1 text-xs text-foreground-muted">· {club}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
