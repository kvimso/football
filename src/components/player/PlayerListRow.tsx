'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist'
import type { PlayerBrowseData } from '@/lib/types'

interface PlayerListRowProps {
  player: PlayerBrowseData
  viewCount?: number
  isWatched?: boolean
}

export function PlayerListRow({ player, isWatched: initialWatched }: PlayerListRowProps) {
  const { t, lang } = useLang()
  const actionInFlightRef = useRef(false)
  const [isWatched, setIsWatched] = useState(initialWatched ?? false)
  const [isPending, startTransition] = useTransition()
  const age = calculateAge(player.date_of_birth)
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'

  useEffect(() => {
    if (!actionInFlightRef.current && initialWatched !== undefined) {
      setIsWatched(initialWatched)
    }
  }, [initialWatched])

  function handleWatch(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!player.id) return
    const playerId = player.id
    actionInFlightRef.current = true
    startTransition(async () => {
      try {
        if (isWatched) {
          const result = await removeFromWatchlist(playerId)
          if (!result.error) setIsWatched(false)
        } else {
          const result = await addToWatchlist(playerId)
          if (!result.error) setIsWatched(true)
        }
      } finally {
        actionInFlightRef.current = false
      }
    })
  }

  return (
    <Link
      href={`/players/${player.slug}`}
      className="table-row-hover flex items-center gap-3 px-4 py-2 text-sm transition-colors"
      style={{ minHeight: '40px' }}
    >
      {/* Photo — 32px rounded square */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-elevated">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <PlayerSilhouette size="sm" className="scale-75 text-foreground-muted/20" />
        )}
      </div>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{displayName}</span>

      {/* Position badge */}
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
      >
        {player.position}
      </span>

      {/* Age */}
      <span className="w-8 text-center text-foreground-muted">{age}</span>

      {/* Club — hidden on mobile */}
      <span className="hidden w-28 truncate text-foreground-muted sm:block">{clubName || '—'}</span>

      {/* Goals — no longer available without season stats */}
      <span className="w-8 text-center font-medium text-foreground-muted">—</span>

      {/* Assists — hidden on mobile */}
      <span className="hidden w-8 text-center font-medium text-foreground-muted sm:block">—</span>

      {/* Matches — hidden below md */}
      <span className="hidden w-8 text-center font-medium text-foreground-muted md:block">—</span>

      {/* Watchlist star */}
      {initialWatched !== undefined && (
        <button
          onClick={handleWatch}
          disabled={isPending}
          className={`shrink-0 text-base leading-none transition-colors ${
            isWatched ? 'text-primary' : 'text-foreground-muted/40 hover:text-primary/70'
          } disabled:opacity-50`}
          aria-label={isWatched ? t('watchlist.unwatch') : t('watchlist.watch')}
        >
          {isWatched ? '★' : '☆'}
        </button>
      )}
    </Link>
  )
}
