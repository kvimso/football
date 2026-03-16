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

interface PlayerCardProps {
  player: PlayerBrowseData
  viewCount?: number
  isWatched?: boolean
}

export function PlayerCard({ player, viewCount, isWatched: initialWatched }: PlayerCardProps) {
  const { t, lang } = useLang()
  const actionInFlightRef = useRef(false)
  const [isWatched, setIsWatched] = useState(initialWatched ?? false)
  const [isPending, startTransition] = useTransition()
  const age = calculateAge(player.date_of_birth)
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const clubName = player.club ? (lang === 'ka' ? player.club.name_ka : player.club.name) : null
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'
  const isFreeAgent = player.status === 'free_agent'
  const isFeatured = player.is_featured

  // Sync from server only when no local action is pending
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
    <Link href={`/players/${player.slug}`} className="card group block overflow-hidden">
      {/* Top row: photo + info + star */}
      <div className="flex gap-3">
        {/* Photo — 56px rounded square */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-elevated">
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <PlayerSilhouette size="sm" className="text-foreground-muted/20" />
          )}
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${posClasses}`}
            >
              {player.position}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground-muted">
            {isFreeAgent ? (
              <span className="font-medium text-yellow-500 shrink-0">{t('players.freeAgent')}</span>
            ) : clubName ? (
              <span className="truncate">{clubName}</span>
            ) : null}
            <span>·</span>
            <span className="shrink-0">{age}</span>
            {player.preferred_foot && (
              <>
                <span>·</span>
                <span>{player.preferred_foot.charAt(0)}</span>
              </>
            )}
          </div>
        </div>

        {/* Watchlist star */}
        {initialWatched !== undefined && (
          <button
            onClick={handleWatch}
            disabled={isPending}
            className={`shrink-0 text-lg leading-none transition-colors ${
              isWatched ? 'text-primary' : 'text-foreground-muted/40 hover:text-primary/70'
            } disabled:opacity-50`}
            aria-label={isWatched ? t('watchlist.unwatch') : t('watchlist.watch')}
          >
            {isWatched ? '★' : '☆'}
          </button>
        )}
      </div>

      {/* Stat chips */}
      {player.season_stats && (
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
            <span className="block text-sm font-medium text-foreground">
              {player.season_stats.goals ?? 0}
            </span>
            <span className="text-[9px] text-foreground-faint">{t('players.goals')}</span>
          </div>
          <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
            <span className="block text-sm font-medium text-foreground">
              {player.season_stats.assists ?? 0}
            </span>
            <span className="text-[9px] text-foreground-faint">{t('players.assists')}</span>
          </div>
          <div className="flex-1 rounded bg-elevated px-2 py-1.5 text-center">
            <span className="block text-sm font-medium text-foreground">
              {player.season_stats.matches_played ?? 0}
            </span>
            <span className="text-[9px] text-foreground-faint">{t('players.matches')}</span>
          </div>
        </div>
      )}

      {/* Featured badge */}
      {isFeatured && (
        <span className="mt-2 inline-block rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-semibold text-primary">
          {t('players.featured')}
        </span>
      )}
    </Link>
  )
}
