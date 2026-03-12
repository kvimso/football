'use client'

import { useState } from 'react'
import { deleteAnnouncement } from '@/app/actions/announcements'

interface Announcement {
  id: string
  content: string
  created_at: string
}

interface AnnouncementListProps {
  announcements: Announcement[]
  labels: {
    delete: string
    confirmDelete: string
    deleting: string
    noAnnouncements: string
  }
}

export function AnnouncementList({ announcements, labels }: AnnouncementListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm(labels.confirmDelete)) return
    setDeletingId(id)
    await deleteAnnouncement(id)
    setDeletingId(null)
  }

  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
        <svg
          className="h-10 w-10 text-foreground-muted/20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
          />
        </svg>
        <p className="mt-2 text-sm text-foreground-muted">{labels.noAnnouncements}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => {
        const date = new Date(a.created_at)
        const formatted = date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        return (
          <div key={a.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-foreground whitespace-pre-wrap">{a.content}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-foreground-muted">{formatted}</span>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={deletingId === a.id}
                className="text-xs text-red-600 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                {deletingId === a.id ? labels.deleting : labels.delete}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
