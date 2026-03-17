'use client'

import { useLang } from '@/hooks/useLang'
import { timeAgo } from '@/lib/utils'
import { ActivityFeed } from './ActivityFeed'
import { WatchlistPanel } from './WatchlistPanel'
import type { ActivityItem } from './ActivityFeed'
import type { WatchlistPanelItem } from './WatchlistPanel'

interface DashboardHomeProps {
  fullName: string
  lastSignInAt: string | null
  watchlistCount: number
  unreadCount: number
  weeklyViewCount: number
  activityItems: ActivityItem[]
  watchlistItems: WatchlistPanelItem[]
}

export function DashboardHome({
  fullName,
  lastSignInAt,
  watchlistCount,
  unreadCount,
  weeklyViewCount,
  activityItems,
  watchlistItems,
}: DashboardHomeProps) {
  const { t } = useLang()

  // Show "last active" only if it's a previous session (not today)
  const showLastActive =
    lastSignInAt && new Date(lastSignInAt).toDateString() !== new Date().toDateString()

  return (
    <div>
      {/* Welcome header */}
      <h1 className="text-2xl font-bold text-foreground">
        {t('dashboard.welcome')}, {fullName}
      </h1>
      {showLastActive && (
        <p className="mt-0.5 text-sm text-foreground-muted">
          {t('dashboard.lastActive').replace('{time}', timeAgo(lastSignInAt))}
        </p>
      )}

      {/* Stat summary bar */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="font-semibold text-foreground">{watchlistCount}</span>{' '}
          <span className="text-foreground-muted">{t('dashboard.playersWatched')}</span>
        </span>
        <span className="text-border hidden sm:inline">|</span>
        <span>
          <span className="font-semibold text-foreground">{unreadCount}</span>{' '}
          <span className="text-foreground-muted">{t('dashboard.unreadMessages')}</span>
        </span>
        <span className="text-border hidden sm:inline">|</span>
        <span>
          <span className="font-semibold text-foreground">{weeklyViewCount}</span>{' '}
          <span className="text-foreground-muted">{t('dashboard.profilesViewed')}</span>
        </span>
      </div>

      {/* 60/40 split: Activity feed + Watchlist panel */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground-muted uppercase tracking-wider">
            {t('dashboard.activityFeed')}
          </h2>
          <ActivityFeed items={activityItems} />
        </div>

        <div className="hidden md:block">
          <WatchlistPanel items={watchlistItems} totalCount={watchlistCount} />
        </div>
      </div>
    </div>
  )
}
