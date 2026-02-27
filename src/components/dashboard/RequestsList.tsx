'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { format } from 'date-fns'
import type { Position } from '@/lib/types'

interface RequestItem {
  id: string
  message: string
  status: string | null
  created_at: string | null
  responded_at: string | null
  expires_at: string | null
  response_message: string | null
  player: {
    name: string
    name_ka: string
    slug: string
    position: Position
    club: { name: string; name_ka: string } | null
  } | null
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function isExpired(item: RequestItem): boolean {
  if (item.status !== 'pending') return false
  if (!item.expires_at) return false
  return new Date(item.expires_at) < new Date()
}

type DisplayGroup = 'active' | 'approved' | 'rejected' | 'expired'

function getDisplayGroup(item: RequestItem): DisplayGroup {
  if (isExpired(item)) return 'expired'
  if (item.status === 'approved') return 'approved'
  if (item.status === 'rejected') return 'rejected'
  return 'active'
}

const groupOrder: DisplayGroup[] = ['active', 'approved', 'rejected', 'expired']

const statusColors: Record<string, string> = {
  active: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  expired: 'bg-gray-500/20 text-gray-400',
}

export function RequestsList({ items }: { items: RequestItem[] }) {
  const { t, lang } = useLang()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl text-foreground-muted/30 mb-4">&#9993;</div>
        <p className="text-lg font-medium text-foreground-muted">{t('dashboard.noRequests')}</p>
        <p className="mt-1 text-sm text-foreground-muted/70">{t('dashboard.noRequestsHint')}</p>
        <Link href="/players" className="btn-primary mt-4 text-sm">
          {t('home.browsePlayers')}
        </Link>
      </div>
    )
  }

  // Group items by display status
  const grouped = new Map<DisplayGroup, RequestItem[]>()
  for (const group of groupOrder) grouped.set(group, [])
  for (const item of items) {
    const group = getDisplayGroup(item)
    grouped.get(group)!.push(item)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t('dashboard.requests')} ({items.length})
      </h2>
      <div className="space-y-3">
        {groupOrder.map((group) => {
          const groupItems = grouped.get(group)!
          if (groupItems.length === 0) return null
          return groupItems.map((item) => (
            <RequestCard key={item.id} item={item} group={group} lang={lang} t={t} />
          ))
        })}
      </div>
    </div>
  )
}

function RequestCard({
  item,
  group,
  lang,
  t,
}: {
  item: RequestItem
  group: DisplayGroup
  lang: string
  t: (key: string) => string
}) {
  const player = item.player
  const displayName = player
    ? lang === 'ka' ? player.name_ka : player.name
    : t('matches.unknown')
  const clubName = player?.club
    ? lang === 'ka' ? player.club.name_ka : player.club.name
    : null

  const statusClasses = statusColors[group]
  const statusLabel = group === 'active'
    ? t('dashboard.pending')
    : t(`dashboard.${group}`)

  const daysSent = item.created_at ? getDaysSince(item.created_at) : 0

  return (
    <div className={`card ${group === 'expired' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {player ? (
            <Link href={`/players/${player.slug}`} className="font-medium text-foreground hover:text-accent transition-colors">
              {displayName}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{displayName}</span>
          )}
          <div className="mt-0.5 text-xs text-foreground-muted">
            {player?.position}{clubName ? ` \u00b7 ${clubName}` : ''}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
        {item.message}
      </p>

      {/* Expiry context for pending requests */}
      {group === 'active' && (
        <p className="mt-2 text-xs text-yellow-400/80">
          {t('dashboard.waitingForResponse')} &mdash; {t('dashboard.daysSent').replace('{days}', String(daysSent))}
        </p>
      )}

      {/* Expired message */}
      {group === 'expired' && (
        <p className="mt-2 text-xs text-gray-400">
          {t('dashboard.expiredNoResponse')}
        </p>
      )}

      {/* Approved with response message */}
      {group === 'approved' && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-green-400">{t('dashboard.approvedMessage')}</p>
          {item.response_message && (
            <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3">
              <p className="text-xs font-medium text-green-400 mb-1">{t('dashboard.adminResponse')}</p>
              <p className="text-sm text-foreground-muted">{item.response_message}</p>
            </div>
          )}
          <p className="text-xs text-foreground-muted/50 italic">{t('dashboard.fullMessagingSoon')}</p>
        </div>
      )}

      <div className="mt-3 text-xs text-foreground-muted/70">
        {t('dashboard.sentOn')} {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy') : ''}
        {item.responded_at && (
          <span> &middot; {t('dashboard.responded')} {format(new Date(item.responded_at), 'dd MMM yyyy')}</span>
        )}
      </div>
    </div>
  )
}
