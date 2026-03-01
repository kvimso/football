'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { sendContactRequest } from '@/app/actions/contact'

interface ContactRequestFormProps {
  playerId: string
}

export function ContactRequestForm({ playerId }: ContactRequestFormProps) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = await sendContactRequest(playerId, message)
      if (result.error) {
        setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
      } else {
        setSent(true)
        setOpen(false)
      }
    })
  }

  if (sent) {
    return (
      <span className="rounded-lg bg-accent-muted/30 px-4 py-2 text-sm font-medium text-accent">
        {t('dashboard.requestSent')}
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary text-sm"
      >
        {t('dashboard.sendRequest')}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('dashboard.messagePlaceholder')}
        rows={3}
        className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent transition-colors"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending || !message.trim()}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {isPending ? t('common.loading') : t('common.save')}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="btn-secondary text-sm"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
