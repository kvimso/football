'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import type { NotificationType } from '@/lib/notifications/types'

const TYPE_ICONS: Record<NotificationType, { path: string; color: string }> = {
  goal: {
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z',
    color: 'text-green-400',
  },
  assist: {
    path: 'M7.5 3.5 3 8l4.5 4.5M16.5 3.5 21 8l-4.5 4.5M3 8h18M12 8v13',
    color: 'text-cyan-400',
  },
  club_change: {
    path: 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0-4.5 4.5M21 12H7.5',
    color: 'text-amber-400',
  },
  free_agent: {
    path: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    color: 'text-purple-400',
  },
  new_video: {
    path: 'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
    color: 'text-red-400',
  },
  announcement: {
    path: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.75.75 0 0 1-1.021-.272 18.152 18.152 0 0 1-1.877-4.129m4.943-2.273c.052.63.091 1.264.117 1.902a.75.75 0 0 1-.363.682 18.09 18.09 0 0 1-1.497.82M16.5 12a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Z',
    color: 'text-blue-400',
  },
}

interface Props {
  id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
  onMarkRead: (id: string) => void
}

export function NotificationItem({
  id,
  type,
  title,
  body,
  link,
  isRead,
  createdAt,
  onMarkRead,
}: Props) {
  const icon = TYPE_ICONS[type]

  const content = (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-background-secondary ${!isRead ? 'bg-accent/5' : ''}`}
    >
      {/* Type icon */}
      <div className={`mt-0.5 shrink-0 ${icon.color}`}>
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-xs leading-snug ${!isRead ? 'text-foreground font-medium' : 'text-foreground-muted'}`}
        >
          {title}
        </p>
        {body && <p className="mt-0.5 text-[11px] text-foreground-muted/70 truncate">{body}</p>}
        <p className="mt-0.5 text-[10px] text-foreground-muted/50">{timeAgo(createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </div>
  )

  if (link) {
    return (
      <Link href={link} onClick={() => !isRead && onMarkRead(id)} className="block">
        {content}
      </Link>
    )
  }

  return (
    <button onClick={() => !isRead && onMarkRead(id)} className="block w-full text-left">
      {content}
    </button>
  )
}
