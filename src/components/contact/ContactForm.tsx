'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { submitContactMessage } from '@/app/actions/contact-message'

export function ContactForm({ defaultEmail }: { defaultEmail?: string }) {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await submitContactMessage({ name, email, message })
      if (result.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t('contact.sent')}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{t('contact.sentDesc')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-foreground-muted">
          {t('contact.name')}
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-foreground-muted">
          {t('contact.email')}
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-foreground-muted">
          {t('contact.message')}
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('contact.messagePlaceholder')}
          className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-3 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3 text-base disabled:opacity-50"
      >
        {isPending ? t('common.loading') : t('contact.send')}
      </button>
    </form>
  )
}
