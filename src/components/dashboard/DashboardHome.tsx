'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { timeAgo } from '@/lib/utils'
import { StarIcon, MessageIcon, ArrowsIcon } from '@/components/ui/Icons'
import type { Notification } from '@/lib/notifications/types'

interface DashboardHomeProps {
  fullName: string
  watchlistCount: number
  messageCount: number
  unreadCount: number
  recentNotifications: Notification[]
}

export function DashboardHome({
  fullName,
  watchlistCount,
  messageCount,
  unreadCount,
  recentNotifications,
}: DashboardHomeProps) {
  const { t } = useLang()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t('dashboard.welcome')}, {fullName}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/watchlist" className="card group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <StarIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent">{watchlistCount}</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.watchlist')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">{t('dashboard.watchlistDesc')}</div>
        </Link>

        <Link href="/dashboard/messages" className="card group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <MessageIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent">{messageCount}</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.messages')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">
            {unreadCount > 0 ? `${unreadCount} ${t('chat.unread')}` : t('dashboard.messagesDesc')}
          </div>
        </Link>

        <Link href="/players/compare" className="card group">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ArrowsIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-accent/50">&#8644;</div>
              <div className="text-sm font-medium text-foreground">{t('dashboard.compare')}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-foreground-muted">{t('dashboard.compareDesc')}</div>
        </Link>
      </div>

      {/* Recent notifications */}
      {recentNotifications.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">{t('notifications.title')}</h2>
            <Link href="/dashboard/notifications" className="text-xs text-accent hover:underline">
              {t('notifications.viewAll')}
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/50">
            {recentNotifications.slice(0, 5).map((n) => (
              <Link
                key={n.id}
                href={n.link ?? '/dashboard/notifications'}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-background-secondary ${!n.is_read ? 'bg-accent/5' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs leading-snug truncate ${!n.is_read ? 'text-foreground font-medium' : 'text-foreground-muted'}`}
                  >
                    {n.title}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-foreground-muted/50">
                  {timeAgo(n.created_at)}
                </span>
                {!n.is_read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/players" className="btn-primary text-sm">
            {t('home.browsePlayers')}
          </Link>
          <Link href="/matches" className="btn-secondary text-sm">
            {t('nav.matches')}
          </Link>
          <Link href="/clubs" className="btn-secondary text-sm">
            {t('nav.clubs')}
          </Link>
        </div>
      </div>
    </div>
  )
}
