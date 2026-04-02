'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { submitContactMessage } from '@/app/actions/contact-message'
import { CONTACT_SUBJECTS, type ContactSubject } from '@/lib/constants'

const SUBJECT_KEYS: Record<ContactSubject, string> = {
  general: 'contact.subjectGeneral',
  academy: 'contact.subjectAcademy',
  scouting: 'contact.subjectScout',
  camera: 'contact.subjectCamera',
  media: 'contact.subjectMedia',
}

export function ContactForm({
  defaultEmail,
  defaultSubject,
}: {
  defaultEmail?: string
  defaultSubject?: string
}) {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [subject, setSubject] = useState<ContactSubject>(
    CONTACT_SUBJECTS.includes(defaultSubject as ContactSubject)
      ? (defaultSubject as ContactSubject)
      : 'general'
  )
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const result = await submitContactMessage({ name, email, subject, message })
      if (result.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t('contact.sent')}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{t('contact.sentDesc')}</p>
      </div>
    )
  }

  const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.15em] text-foreground-faint'
  const inputClass =
    'mt-1.5 w-full rounded-md border border-border bg-background p-[13px] text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/8'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="contact-form">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>
            {t('contact.name')}
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>
            {t('contact.email')}
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelClass}>
          {t('contact.subject')}
        </label>
        <select
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value as ContactSubject)}
          className={inputClass}
        >
          {CONTACT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {t(SUBJECT_KEYS[s])}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          {t('contact.message')}
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('contact.messagePlaceholder')}
          className={`${inputClass} resize-none placeholder-foreground-muted`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3.5 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-50"
        style={{ boxShadow: '0 4px 16px rgba(27,138,74,0.2)' }}
      >
        {isPending ? t('common.loading') : t('contact.send')}
      </button>
    </form>
  )
}
