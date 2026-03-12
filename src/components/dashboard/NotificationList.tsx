'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { timeAgo } from '@/lib/utils'
import { getNotificationsPage, markAsRead, markAllAsRead } from '@/app/actions/notifications'
import type { NotificationFilters } from '@/app/actions/notifications'
import type { Notification, NotificationType } from '@/lib/notifications/types'

const TYPE_ICONS: Record<NotificationType, { path: string; color: string }> = {
  goal: {
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z',
    color: 'text-green-700',
  },
  assist: {
    path: 'M7.5 3.5 3 8l4.5 4.5M16.5 3.5 21 8l-4.5 4.5M3 8h18M12 8v13',
    color: 'text-cyan-700',
  },
  club_change: {
    path: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0-4.5 4.5M21 12H7.5',
    color: 'text-amber-700',
  },
  free_agent: {
    path: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    color: 'text-purple-700',
  },
  new_video: {
    path: 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
    color: 'text-red-600',
  },
  announcement: {
    path: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.272 18.152 18.152 0 0 1-1.877-4.129m4.943-2.273c.052.63.091 1.264.117 1.902a.75.75 0 0 1-.363.682 18.09 18.09 0 0 1-1.497.82M16.5 12a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z',
    color: 'text-blue-700',
  },
}

const ALL_TYPES: NotificationType[] = [
  'goal',
  'assist',
  'club_change',
  'free_agent',
  'new_video',
  'announcement',
]
const TYPE_KEYS: Record<NotificationType, string> = {
  goal: 'notifications.goal',
  assist: 'notifications.assist',
  club_change: 'notifications.clubChange',
  free_agent: 'notifications.freeAgent',
  new_video: 'notifications.newVideo',
  announcement: 'notifications.announcement',
}

const PAGE_SIZE = 20

interface Props {
  initialNotifications: Notification[]
  initialTotal: number
}

export function NotificationList({ initialNotifications, initialTotal }: Props) {
  const { t } = useLang()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<NotificationType | undefined>(undefined)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPage = useCallback(
    async (newPage: number, filters?: NotificationFilters) => {
      setLoading(true)
      const result = await getNotificationsPage(
        newPage,
        filters ?? { type: typeFilter, readStatus: readFilter }
      )
      setNotifications(result.notifications)
      setTotal(result.total)
      setPage(newPage)
      setLoading(false)
    },
    [typeFilter, readFilter]
  )

  const handleTypeChange = (type: NotificationType | undefined) => {
    setTypeFilter(type)
    fetchPage(1, { type, readStatus: readFilter })
  }

  const handleReadChange = (status: 'all' | 'unread' | 'read') => {
    setReadFilter(status)
    fetchPage(1, { type: typeFilter, readStatus: status })
  }

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const hasUnread = notifications.some((n) => !n.is_read)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">{t('notifications.title')}</h1>
        {hasUnread && (
          <button onClick={handleMarkAllRead} className="text-xs text-accent hover:underline">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Type filter */}
        <select
          value={typeFilter ?? ''}
          onChange={(e) =>
            handleTypeChange(e.target.value ? (e.target.value as NotificationType) : undefined)
          }
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <option value="">{t('notifications.allTypes')}</option>
          {ALL_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(TYPE_KEYS[type])}
            </option>
          ))}
        </select>

        {/* Read status filter */}
        <select
          value={readFilter}
          onChange={(e) => handleReadChange(e.target.value as 'all' | 'unread' | 'read')}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground"
        >
          <option value="all">{t('notifications.allStatus')}</option>
          <option value="unread">{t('notifications.unreadOnly')}</option>
          <option value="read">{t('notifications.readOnly')}</option>
        </select>

        <span className="ml-auto text-xs text-foreground-muted">
          {total} {t('common.found')}
        </span>
      </div>

      {/* List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl text-foreground-muted/30 mb-2">&#128276;</div>
            <p className="text-sm text-foreground-muted">{t('notifications.empty')}</p>
          </div>
        ) : (
          notifications.map((n) => {
            const icon = TYPE_ICONS[n.type]
            const content = (
              <div
                className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-background-secondary ${!n.is_read ? 'bg-accent/5' : ''}`}
              >
                <div className={`mt-0.5 shrink-0 ${icon.color}`}>
                  <svg
                    className="h-4.5 w-4.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-snug ${!n.is_read ? 'text-foreground font-medium' : 'text-foreground-muted'}`}
                    >
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-foreground-muted/50">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-foreground-muted/70">{n.body}</p>}
                  <span
                    className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${icon.color} bg-current/10`}
                  >
                    {t(TYPE_KEYS[n.type])}
                  </span>
                </div>
                {!n.is_read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
            )

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className="block"
                >
                  {content}
                </Link>
              )
            }
            return (
              <button
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className="block w-full text-left"
              >
                {content}
              </button>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
          >
            &larr;
          </button>
          <span className="text-xs text-foreground-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
