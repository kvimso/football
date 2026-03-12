'use client'

import { useState } from 'react'
import { POSITION_COLOR_CLASSES, POSITION_LEFT_BORDER_CLASSES } from '@/lib/constants'
import { TransferActions } from './TransferActions'
import { format } from 'date-fns'
import type { Position } from '@/lib/types'

interface TransferCardProps {
  requestId: string
  playerName: string
  position: string | null
  platformId: string | null
  clubName: string
  direction: 'incoming' | 'outgoing'
  status: string
  requestedAt: string | null
  index: number
  t: (key: string) => string
}

export function TransferCard({
  requestId,
  playerName,
  position,
  platformId,
  clubName,
  direction,
  status,
  requestedAt,
  index,
  t,
}: TransferCardProps) {
  const [now] = useState(() => Date.now())
  const pos = position as Position | null
  const posClasses = pos ? POSITION_COLOR_CLASSES[pos] : ''
  const leftBorder = pos ? POSITION_LEFT_BORDER_CLASSES[pos] : 'border-l-accent'

  // Countdown for pending transfers (7-day expiry)
  let daysLeft: number | null = null
  let progressPercent = 0
  if (status === 'pending' && requestedAt) {
    const elapsed = (now - new Date(requestedAt).getTime()) / (1000 * 60 * 60 * 24)
    daysLeft = Math.max(0, Math.ceil(7 - elapsed))
    progressPercent = Math.max(0, Math.min(100, (daysLeft / 7) * 100))
  }

  const isPending = status === 'pending'
  const dirArrow = direction === 'incoming' ? '←' : '→'

  const statusConfig: Record<string, { classes: string; icon: string }> = {
    accepted: { classes: 'bg-accent/10 text-accent', icon: '✓' },
    declined: { classes: 'bg-red-500/10 text-red-600', icon: '✗' },
    expired: { classes: 'bg-foreground-muted/10 text-foreground-muted', icon: '⏱' },
  }
  const badge = statusConfig[status]

  return (
    <div
      className={`animate-transfer-card-in group relative overflow-hidden rounded-xl border-l-[4px] ${leftBorder} ${
        isPending ? 'border border-accent/15 bg-card shadow-sm' : 'border border-border bg-card'
      } transition-all duration-200 hover:bg-card-hover hover:shadow-md`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Position badge */}
        {pos && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wider ${posClasses}`}
          >
            {pos}
          </span>
        )}

        {/* Player → Club */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{playerName}</span>
            <span className="text-sm text-foreground-muted/30">{dirArrow}</span>
            <span className="truncate text-sm text-foreground-muted">{clubName}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-foreground-muted/50">
            {platformId && <span className="font-mono">{platformId}</span>}
            {requestedAt && (
              <>
                <span>&middot;</span>
                <span>{format(new Date(requestedAt), 'MMM d, yyyy')}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions or Status */}
        <div className="shrink-0">
          {isPending ? (
            <TransferActions requestId={requestId} />
          ) : badge ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.classes}`}
            >
              {badge.icon} {t(`admin.transfers.${status}`)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Countdown progress bar */}
      {isPending && daysLeft !== null && (
        <div className="px-4 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-background-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent/30 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-foreground-muted/40">{daysLeft}d</span>
          </div>
        </div>
      )}
    </div>
  )
}
