'use client'

import { useState } from 'react'
import { createAnnouncement } from '@/app/actions/announcements'

const MAX_LENGTH = 500

interface AnnouncementFormProps {
  labels: {
    placeholder: string
    publish: string
    publishing: string
    charsRemaining: string
    rateLimitReached: string
    published: string
    error: string
  }
}

export function AnnouncementForm({ labels }: AnnouncementFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const remaining = MAX_LENGTH - content.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    setFeedback(null)

    const result = await createAnnouncement(content)

    if (result.error) {
      const message = result.error.includes('rateLimitReached')
        ? labels.rateLimitReached
        : labels.error
      setFeedback({ type: 'error', message })
    } else {
      setContent('')
      setFeedback({ type: 'success', message: labels.published })
      setTimeout(() => setFeedback(null), 3000)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        placeholder={labels.placeholder}
        rows={3}
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        disabled={loading}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs ${remaining < 50 ? 'text-red-400' : 'text-foreground-muted'}`}>
          {remaining} {labels.charsRemaining}
        </span>
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? labels.publishing : labels.publish}
        </button>
      </div>
      {feedback && (
        <p
          className={`mt-2 text-xs ${feedback.type === 'success' ? 'text-accent' : 'text-red-400'}`}
        >
          {feedback.message}
        </p>
      )}
    </form>
  )
}
