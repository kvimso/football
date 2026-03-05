'use client'

import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { NotificationItem } from './NotificationItem'
import type { Notification } from '@/lib/notifications/types'

interface Props {
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  loading: boolean
}

export function NotificationDropdown({ notifications, onMarkRead, onMarkAllRead, loading }: Props) {
  const { t } = useLang()

  return (
    <div className="absolute right-0 top-full mt-1.5 z-50 w-80 max-h-[420px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold text-foreground">{t('notifications.title')}</h3>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-accent hover:underline"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto max-h-[370px] divide-y divide-border/50">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-2xl text-foreground-muted/30 mb-1">&#128276;</div>
            <p className="text-xs text-foreground-muted">{t('notifications.empty')}</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              body={n.body}
              link={n.link}
              isRead={n.is_read}
              createdAt={n.created_at}
              onMarkRead={onMarkRead}
            />
          ))
        )}
      </div>

      {/* View All link */}
      {notifications.length > 0 && (
        <Link
          href="/dashboard/notifications"
          className="block border-t border-border px-3 py-2 text-center text-[11px] font-medium text-accent hover:bg-background-secondary transition-colors"
        >
          {t('notifications.viewAll')}
        </Link>
      )}
    </div>
  )
}
