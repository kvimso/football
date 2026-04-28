'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MessageAcademyButtonProps {
  clubId: string
}

const ERROR_LABELS: Record<string, string> = {
  'errors.notAuthenticated': 'Please sign in to message academies.',
  'errors.accountPendingApproval': 'Your account is pending approval.',
  'errors.clubNotFound': 'Club not found.',
  'errors.clubNotSetUpForMessaging': 'This club has not set up messaging yet.',
  'errors.rateLimitConversations':
    "You've reached the daily conversation limit. Try again tomorrow.",
}

function labelForError(key: string | null | undefined, fallback: string): string {
  if (!key) return fallback
  if (ERROR_LABELS[key]) return ERROR_LABELS[key]
  // If the API returned plain English (not a key), surface it directly.
  return key.startsWith('errors.') ? fallback : key
}

export function MessageAcademyButton({ clubId }: MessageAcademyButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ club_id: clubId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(labelForError(data.error, 'Something went wrong. Please try again.'))
        return
      }

      router.push(`/messages/${data.conversation.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="btn-primary text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Opening conversation…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            Message academy
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
