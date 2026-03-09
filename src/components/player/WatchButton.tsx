'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist'

interface WatchButtonProps {
  playerId: string
  isWatched: boolean
  size?: 'sm' | 'md'
}

export function WatchButton({ playerId, isWatched: initial, size = 'sm' }: WatchButtonProps) {
  const [isWatched, setIsWatched] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const { t } = useLang()

  function handleToggle() {
    startTransition(async () => {
      if (isWatched) {
        const result = await removeFromWatchlist(playerId)
        if (!result.error) setIsWatched(false)
      } else {
        const result = await addToWatchlist(playerId)
        if (!result.error) setIsWatched(true)
      }
    })
  }

  const baseClasses =
    size === 'md'
      ? 'rounded-lg px-4 py-2 text-sm font-medium transition-colors'
      : 'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors'

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`${baseClasses} ${
        isWatched
          ? 'bg-accent/20 text-accent border border-accent/30'
          : 'bg-background-secondary text-foreground-muted border border-border hover:text-foreground hover:border-accent/50'
      } disabled:opacity-50`}
    >
      {isPending ? '...' : isWatched ? `★ ${t('watchlist.watching')}` : `☆ ${t('watchlist.watch')}`}
    </button>
  )
}
