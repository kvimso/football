'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { calculateAge, unwrapRelation } from '@/lib/utils'
import { POSITION_COLOR_CLASSES, POSITION_LEFT_BORDER_CLASSES } from '@/lib/constants'
import {
  searchPlayersForTransfer,
  requestTransfer,
  claimFreeAgent,
} from '@/app/actions/admin-transfers'
import type { Position, PlayerStatus } from '@/lib/types'

interface SearchResult {
  id: string
  name: string
  name_ka: string
  platform_id: string
  position: Position
  date_of_birth: string
  status: PlayerStatus | null
  club: { id: string; name: string; name_ka: string } | null
}

export function TransferSearch() {
  const { t, lang } = useLang()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, startSearch] = useTransition()
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  function handleSearch() {
    if (query.trim().length < 2) return
    setActionMsg('')
    startSearch(async () => {
      const res = await searchPlayersForTransfer(query)
      if (res.error) {
        console.error(res.error)
      }
      setResults(
        (res.players ?? []).map((p) => ({
          ...p,
          position: p.position as Position,
          status: p.status as PlayerStatus | null,
          club: unwrapRelation(p.club),
        }))
      )
      setSearched(true)
    })
  }

  function handleRequestTransfer(playerId: string) {
    setActingOn(playerId)
    startSearch(async () => {
      const res = await requestTransfer(playerId)
      if (res.error) {
        setErrorMsg(res.error.startsWith('errors.') ? t(res.error) : res.error)
      } else {
        setErrorMsg('')
        setActionMsg(t('admin.transfers.requestSent').replace('{club}', res.clubName ?? ''))
        setResults((prev) => prev.filter((p) => p.id !== playerId))
        router.refresh()
      }
      setActingOn(null)
    })
  }

  function handleClaimFreeAgent(playerId: string) {
    setActingOn(playerId)
    startSearch(async () => {
      const res = await claimFreeAgent(playerId)
      if (res.error) {
        setErrorMsg(res.error.startsWith('errors.') ? t(res.error) : res.error)
      } else {
        setErrorMsg('')
        setActionMsg(t('admin.transfers.claimSuccess').replace('{name}', res.playerName ?? ''))
        setResults((prev) => prev.filter((p) => p.id !== playerId))
        router.refresh()
      }
      setActingOn(null)
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('admin.transfers.searchPlaceholder')}
              aria-label={t('admin.transfers.searchTitle')}
              className="w-full rounded-lg border border-border bg-background-secondary py-2.5 pl-10 pr-3 text-sm text-foreground placeholder-foreground-muted/40 transition-colors focus:border-accent/40 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover disabled:opacity-40"
          >
            {searching && !actingOn ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg
                className="h-3.5 w-3.5"
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
            )}
            {searching && !actingOn ? t('common.loading') : t('admin.common.search')}
          </button>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 p-3 text-sm text-accent animate-slide-in-down">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            {actionMsg}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-slide-in-down">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            {errorMsg}
          </div>
        )}

        {/* No results */}
        {searched && results.length === 0 && !actionMsg && (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <svg
              className="h-8 w-8 text-foreground-muted/15"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <p className="mt-2 text-sm text-foreground-muted/40">{t('admin.common.noResults')}</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((player, i) => {
              const displayName = lang === 'ka' ? player.name_ka : player.name
              const clubName = player.club
                ? lang === 'ka'
                  ? player.club.name_ka
                  : player.club.name
                : null
              const age = calculateAge(player.date_of_birth)
              const posClasses = POSITION_COLOR_CLASSES[player.position] ?? ''
              const leftBorder = POSITION_LEFT_BORDER_CLASSES[player.position] ?? 'border-l-accent'
              const isFreeAgent = player.status === 'free_agent' || !player.club
              const isActing = actingOn === player.id

              return (
                <div
                  key={player.id}
                  className={`animate-transfer-card-in flex items-center gap-3 rounded-xl border-l-[4px] ${leftBorder} border border-border bg-card px-4 py-3 transition-all hover:bg-card-hover hover:shadow-sm`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Position badge */}
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wider ${posClasses}`}
                  >
                    {player.position}
                  </span>

                  {/* Player info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">{displayName}</span>
                      {isFreeAgent ? (
                        <span className="text-[11px] font-medium text-yellow-400">
                          {t('admin.transfers.freeAgent')}
                        </span>
                      ) : (
                        <span className="truncate text-sm text-foreground-muted">{clubName}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground-muted/50">
                      <span className="font-mono">{player.platform_id}</span>
                      <span>&middot;</span>
                      <span>
                        {age} {t('players.years')}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {isFreeAgent ? (
                      <button
                        onClick={() => handleClaimFreeAgent(player.id)}
                        disabled={searching}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-700 transition-all hover:bg-green-500/20 disabled:opacity-50"
                        title={t('admin.transfers.claimPlayer')}
                      >
                        {isActing ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400/30 border-t-green-400" />
                        ) : (
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
                              d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                            />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestTransfer(player.id)}
                        disabled={searching}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
                        title={t('admin.transfers.requestTransfer')}
                      >
                        {isActing ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                        ) : (
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
                              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
