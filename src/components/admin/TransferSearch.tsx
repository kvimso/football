'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { searchPlayersForTransfer, requestTransfer, claimFreeAgent } from '@/app/actions/admin-transfers'

interface SearchResult {
  id: string
  name: string
  name_ka: string
  platform_id: string
  position: string
  date_of_birth: string
  status: string | null
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

  function handleSearch() {
    if (query.trim().length < 2) return
    setActionMsg('')
    startSearch(async () => {
      const res = await searchPlayersForTransfer(query)
      if (res.error) {
        console.error(res.error)
      }
      setResults((res.players ?? []).map((p) => ({
        ...p,
        club: Array.isArray(p.club) ? p.club[0] : p.club,
      })))
      setSearched(true)
    })
  }

  function handleRequestTransfer(playerId: string) {
    setActingOn(playerId)
    startSearch(async () => {
      const res = await requestTransfer(playerId)
      if (res.error) {
        alert(res.error)
      } else {
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
        alert(res.error)
      } else {
        setActionMsg(t('admin.transfers.claimSuccess').replace('{name}', res.playerName ?? ''))
        setResults((prev) => prev.filter((p) => p.id !== playerId))
        router.refresh()
      }
      setActingOn(null)
    })
  }

  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold text-foreground">{t('admin.transfers.searchTitle')}</h2>
      <p className="mt-1 text-xs text-foreground-muted">{t('admin.transfers.searchHint')}</p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('admin.transfers.searchPlaceholder')}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching || query.trim().length < 2}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {searching && !actingOn ? t('common.loading') : t('admin.common.search')}
        </button>
      </div>

      {actionMsg && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">
          {actionMsg}
        </div>
      )}

      {searched && results.length === 0 && !actionMsg && (
        <p className="mt-3 text-sm text-foreground-muted">{t('admin.common.noResults')}</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((player) => {
            const displayName = lang === 'ka' ? player.name_ka : player.name
            const clubName = player.club
              ? lang === 'ka' ? player.club.name_ka : player.club.name
              : null
            const age = calculateAge(player.date_of_birth)
            const posClasses = POSITION_COLOR_CLASSES[player.position] ?? ''
            const isFreeAgent = player.status === 'free_agent' || !player.club
            const isActing = actingOn === player.id

            return (
              <div key={player.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{displayName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}>
                      {player.position}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                    <span className="font-mono">{player.platform_id}</span>
                    <span>&middot;</span>
                    {isFreeAgent ? (
                      <span className="font-medium text-yellow-400">{t('admin.transfers.freeAgent')}</span>
                    ) : (
                      <span>{clubName}</span>
                    )}
                    <span>&middot;</span>
                    <span>{age} {t('players.years')}</span>
                  </div>
                </div>
                <div className="ml-3 shrink-0">
                  {isFreeAgent ? (
                    <button
                      onClick={() => handleClaimFreeAgent(player.id)}
                      disabled={searching}
                      className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      {isActing ? t('common.loading') : t('admin.transfers.claimPlayer')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestTransfer(player.id)}
                      disabled={searching}
                      className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50 transition-colors"
                    >
                      {isActing ? t('common.loading') : t('admin.transfers.requestTransfer')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
