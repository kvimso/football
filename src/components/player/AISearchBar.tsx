'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLang } from '@/hooks/useLang'
import type { AISearchFilters } from '@/lib/ai-search/types'

interface SearchHistoryEntry {
  id: string
  query_text: string
  result_count: number
  created_at: string
}

interface AISearchBarProps {
  onSearchResults: (players: Array<Record<string, unknown>>, filters: AISearchFilters) => void
  onClearSearch: () => void
  isActive: boolean
}

const AI_SEARCH_TIMEOUT = 10_000

export function AISearchBar({ onSearchResults, onClearSearch, isActive }: AISearchBarProps) {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/players/ai-search/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.data?.history ?? [])
      }
    } catch {
      // Silent fail — history is non-critical
    }
  }, [])

  // Fetch search history on mount
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Close history dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim()
      if (!q || isSearching) return

      // Abort any pending search
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsSearching(true)
      setError(null)

      try {
        const timeoutId = setTimeout(() => controller.abort(), AI_SEARCH_TIMEOUT)

        const res = await fetch('/api/players/ai-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          if (res.status === 429) {
            setError(t('aiSearch.rateLimit'))
          } else if (res.status === 503) {
            setError(t('aiSearch.error'))
          } else {
            setError(t('aiSearch.error'))
          }
          return
        }

        const data = await res.json()
        onSearchResults(data.data.players, data.data.filters_applied)

        // Refresh history after successful search
        fetchHistory()
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setError(t('aiSearch.timeout'))
        } else {
          setError(t('aiSearch.error'))
        }
      } finally {
        setIsSearching(false)
      }
    },
    [query, isSearching, onSearchResults, fetchHistory, t]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch()
    }
  }

  const handleHistoryClick = (queryText: string) => {
    setQuery(queryText)
    setShowHistory(false)
    handleSearch(queryText)
  }

  const handleClear = () => {
    setQuery('')
    setError(null)
    onClearSearch()
    inputRef.current?.focus()
  }

  if (process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED !== 'true') {
    return null
  }

  return (
    <div ref={wrapperRef} className="relative mb-4">
      {/* Search input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* AI sparkle icon */}
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-700/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => history.length > 0 && setShowHistory(true)}
            placeholder={t('aiSearch.placeholder')}
            disabled={isSearching}
            aria-label={t('aiSearch.placeholder')}
            className="w-full rounded-xl border border-purple-500/20 bg-purple-500/[0.04] pl-10 pr-10 py-2.5 text-sm text-foreground placeholder-foreground-muted/60 outline-none transition-all focus:border-purple-500/40 disabled:opacity-50"
          />
          {/* Clear X button */}
          {(query || isActive) && !isSearching && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted/50 hover:text-foreground transition-colors"
              aria-label={t('aiSearch.clear')}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !query.trim()}
          className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-700 transition-all hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t('aiSearch.searching')}
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              {t('aiSearch.button')}
            </>
          )}
        </button>
      </div>

      {/* Analyzing text */}
      {isSearching && (
        <p className="mt-2 text-xs text-purple-700/70 animate-pulse">{t('aiSearch.analyzing')}</p>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null)
              handleSearch()
            }}
            className="underline hover:text-red-500 transition-colors"
          >
            {t('aiSearch.retry')}
          </button>
        </div>
      )}

      {/* History dropdown */}
      {showHistory && history.length > 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-border bg-surface p-2 shadow-lg">
          <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-foreground-muted/50 font-medium">
            {t('aiSearch.recentSearches')}
          </p>
          <div role="listbox" aria-label={t('aiSearch.recentSearches')}>
            {history.map((entry) => (
              <button
                key={entry.id}
                role="option"
                aria-selected={false}
                onClick={() => handleHistoryClick(entry.query_text)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground-muted hover:bg-surface hover:text-foreground transition-colors text-left"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-foreground-muted/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span className="truncate flex-1">{entry.query_text}</span>
                <span className="shrink-0 text-[10px] text-foreground-muted/40">
                  {entry.result_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History chips (below search bar, always visible) */}
      {!showHistory && history.length > 0 && !isSearching && !isActive && (
        <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-thin">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => handleHistoryClick(entry.query_text)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
            >
              <svg
                className="h-3 w-3 text-purple-700/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              <span className="max-w-[200px] truncate">{entry.query_text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
