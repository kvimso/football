'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { timeAgo } from '@/lib/utils'

interface ActivityItemBase {
  timestamp: string
}

interface ViewActivity extends ActivityItemBase {
  type: 'view'
  playerName: string
  playerSlug: string
}

interface WatchlistAddActivity extends ActivityItemBase {
  type: 'watchlist_add'
  playerName: string
  playerSlug: string
}

interface MessageActivity extends ActivityItemBase {
  type: 'message'
  academyName: string
  conversationId: string
}

interface PlayerUpdateActivity extends ActivityItemBase {
  type: 'player_update'
  playerName: string
  playerSlug: string
}

export type ActivityItem =
  | ViewActivity
  | WatchlistAddActivity
  | MessageActivity
  | PlayerUpdateActivity

const TYPE_ICONS: Record<ActivityItem['type'], string> = {
  view: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.01 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.01-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  watchlist_add:
    'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  message:
    'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
  player_update:
    'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182',
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const { t } = useLang()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface py-12 text-center">
        <div className="text-3xl text-foreground-muted/30 mb-2">&#128196;</div>
        <p className="text-sm font-medium text-foreground-muted">{t('dashboard.noActivity')}</p>
        <Link href="/players" className="mt-2 text-xs text-primary hover:underline">
          {t('dashboard.noActivityHint')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const href = getItemHref(item)
        const description = getDescription(item, t)
        const iconPath = TYPE_ICONS[item.type]
        const isMessage = item.type === 'message'

        return (
          <Link
            key={`${item.type}-${i}`}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-elevated ${
              isMessage ? 'bg-primary/5' : ''
            }`}
          >
            <svg
              className="h-4 w-4 shrink-0 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
            <span className="flex-1 min-w-0 text-sm text-foreground truncate">{description}</span>
            <span className="shrink-0 text-[10px] text-foreground-muted">
              {timeAgo(item.timestamp)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function getItemHref(item: ActivityItem): string {
  switch (item.type) {
    case 'view':
    case 'watchlist_add':
    case 'player_update':
      return `/players/${item.playerSlug}`
    case 'message':
      return `/dashboard/messages/${item.conversationId}`
  }
}

function getDescription(item: ActivityItem, t: (key: string) => string): string {
  switch (item.type) {
    case 'view':
      return t('dashboard.viewedProfile').replace('{name}', item.playerName)
    case 'watchlist_add':
      return t('dashboard.addedToWatchlist').replace('{name}', item.playerName)
    case 'message':
      return t('dashboard.newMessageFrom').replace('{name}', item.academyName)
    case 'player_update':
      return t('dashboard.profileUpdated').replace('{name}', item.playerName)
  }
}
