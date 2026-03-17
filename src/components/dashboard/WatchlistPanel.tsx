'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { calculateAge } from '@/lib/utils'
import { removeFromWatchlist } from '@/app/actions/watchlist'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette'
import type { Position } from '@/lib/types'

export interface WatchlistPanelItem {
  id: string
  player_id: string
  notes: string | null
  created_at: string | null
  player: {
    id: string
    name: string
    name_ka: string
    slug: string
    position: Position
    date_of_birth: string
    photo_url: string | null
    club: { name: string; name_ka: string } | null
  }
}

interface WatchlistPanelProps {
  items: WatchlistPanelItem[]
  totalCount: number
}

export function WatchlistPanel({ items, totalCount }: WatchlistPanelProps) {
  const { t, lang } = useLang()
  const displayItems = items.slice(0, 8)

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t('dashboard.watchlist')}</h3>
        <div className="py-6 text-center">
          <div className="text-2xl text-foreground-muted/30 mb-1">&#9734;</div>
          <p className="text-xs text-foreground-muted">{t('dashboard.noWatchlist')}</p>
          <Link href="/players" className="mt-1 inline-block text-xs text-primary hover:underline">
            {t('dashboard.noActivityHint')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{t('dashboard.watchlist')}</h3>
        {totalCount > 8 && (
          <Link href="/dashboard/watchlist" className="text-xs text-primary hover:underline">
            {t('dashboard.viewAll')} ({totalCount}) &rarr;
          </Link>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto space-y-1">
        {displayItems.map((item) => (
          <PanelRow key={item.id} item={item} lang={lang} t={t} />
        ))}
      </div>
    </div>
  )
}

function PanelRow({
  item,
  lang,
  t,
}: {
  item: WatchlistPanelItem
  lang: string
  t: (key: string) => string
}) {
  const [isPending, startTransition] = useTransition()
  const player = item.player
  const displayName = lang === 'ka' ? player.name_ka : player.name
  const posClasses = POSITION_COLOR_CLASSES[player.position] ?? 'bg-primary/20 text-primary'
  const age = calculateAge(player.date_of_birth)

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      await removeFromWatchlist(item.player_id)
    })
  }

  return (
    <Link
      href={`/players/${player.slug}`}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-elevated"
    >
      {/* Photo */}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background border border-border overflow-hidden">
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <PlayerSilhouette size="sm" className="text-foreground-muted/30" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${posClasses}`}
          >
            {player.position}
          </span>
        </div>
        {item.notes && (
          <p className="text-[11px] text-foreground-muted/70 truncate italic">
            &quot;{item.notes}&quot;
          </p>
        )}
      </div>

      {/* Age + actions */}
      <span className="shrink-0 text-xs text-foreground-muted">{age}</span>

      {/* Compare button */}
      <Link
        href={`/players/compare?p1=${player.slug}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 rounded p-1 text-foreground-muted/50 hover:text-primary transition-colors"
        title={t('dashboard.comparePlayer')}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        </svg>
      </Link>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="shrink-0 rounded p-1 text-foreground-muted/50 hover:text-danger transition-colors disabled:opacity-50"
        title={t('dashboard.removeFromWatchlist')}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </Link>
  )
}
