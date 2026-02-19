'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { format } from 'date-fns'

interface RequestItem {
  id: string
  message: string
  status: string | null
  created_at: string | null
  responded_at: string | null
  player: {
    name: string
    name_ka: string
    slug: string
    position: string
    club: { name: string; name_ka: string } | null
  } | null
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
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

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        {t('dashboard.requests')} ({items.length})
      </h2>
      <div className="space-y-3">
        {items.map((item) => {
          const player = item.player
          const displayName = player
            ? lang === 'ka' ? player.name_ka : player.name
            : t('matches.unknown')
          const clubName = player?.club
            ? lang === 'ka' ? player.club.name_ka : player.club.name
            : null
          const statusClasses = statusColors[item.status ?? 'pending'] ?? statusColors.pending
          const statusLabel = t(`dashboard.${item.status ?? 'pending'}`)

          return (
            <div key={item.id} className="card">
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
                    {player?.position}{clubName ? ` · ${clubName}` : ''}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses}`}>
                  {statusLabel}
                </span>
              </div>

              <p className="mt-3 text-sm text-foreground-muted leading-relaxed">
                {item.message}
              </p>

              <div className="mt-3 text-xs text-foreground-muted/70">
                {t('dashboard.sentOn')} {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy') : ''}
                {item.responded_at && (
                  <span> · {t('dashboard.responded')} {format(new Date(item.responded_at), 'dd MMM yyyy')}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
