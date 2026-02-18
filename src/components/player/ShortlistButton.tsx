'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { addToShortlist, removeFromShortlist } from '@/app/actions/shortlist'

interface ShortlistButtonProps {
  playerId: string
  isShortlisted: boolean
  size?: 'sm' | 'md'
}

export function ShortlistButton({ playerId, isShortlisted: initial, size = 'sm' }: ShortlistButtonProps) {
  const [isShortlisted, setIsShortlisted] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const { t } = useLang()

  function handleToggle() {
    startTransition(async () => {
      if (isShortlisted) {
        const result = await removeFromShortlist(playerId)
        if (!result.error) setIsShortlisted(false)
      } else {
        const result = await addToShortlist(playerId)
        if (!result.error) setIsShortlisted(true)
      }
    })
  }

  const baseClasses = size === 'md'
    ? 'rounded-lg px-4 py-2 text-sm font-medium transition-colors'
    : 'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors'

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`${baseClasses} ${
        isShortlisted
          ? 'bg-accent/20 text-accent border border-accent/30'
          : 'bg-background-secondary text-foreground-muted border border-border hover:text-foreground hover:border-accent/50'
      } disabled:opacity-50`}
    >
      {isPending ? '...' : isShortlisted ? `★ ${t('shortlist.saved')}` : `☆ ${t('shortlist.save')}`}
    </button>
  )
}
