'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/hooks/useLang'

export default function ConversationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLang()

  useEffect(() => {
    console.error('Conversation error:', error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-bold text-foreground">
        {t('chat.threadError')}
      </h1>
      <p className="mt-2 text-sm text-foreground-muted">
        {t('common.errorDescription')}
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary text-sm">
          {t('common.tryAgain')}
        </button>
        <Link
          href="/admin/messages"
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          {t('chat.backToMessages')}
        </Link>
      </div>
    </div>
  )
}
