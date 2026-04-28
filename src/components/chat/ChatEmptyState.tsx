'use client'

import Link from 'next/link'

interface ChatEmptyStateProps {
  userRole: 'scout' | 'academy_admin'
}

export function ChatEmptyState({ userRole }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 w-full flex-col items-center justify-center px-8 text-center">
      <svg
        className="h-14 w-14 text-foreground-muted/20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={0.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
        />
      </svg>
      {userRole === 'scout' ? (
        <>
          <h2 className="mt-5 font-serif text-xl font-semibold text-foreground">
            Start a conversation with a Georgian academy
          </h2>
          <p className="mt-2 max-w-sm text-sm text-foreground-muted">
            Browse clubs, open a profile, and message the academy directly.
          </p>
          <Link href="/clubs" className="btn-primary mt-5 text-sm">
            Browse clubs
          </Link>
        </>
      ) : (
        <>
          <h2 className="mt-5 font-serif text-xl font-semibold text-foreground">
            No conversation selected
          </h2>
          <p className="mt-2 max-w-sm text-sm text-foreground-muted">
            Scouts will reach out when they want to talk about your players.
          </p>
        </>
      )}
    </div>
  )
}
