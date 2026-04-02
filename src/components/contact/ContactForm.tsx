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
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'rgba(74,222,128,0.1)' }}
        >
          <svg
            className="h-8 w-8"
            style={{ color: '#4ADE80' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        {/* Hardcoded light text — always on dark form card */}
        <h2 className="text-2xl font-bold" style={{ color: '#EEECE8' }}>
          {t('contact.sent')}
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'rgba(238,236,232,0.5)' }}>
          {t('contact.sentDesc')}
        </p>
      </div>
    )
  }

  /* Hardcoded dark-theme styles — this form always sits on a dark gradient card */
  const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.15em]'
  const labelStyle = { color: 'rgba(238,236,232,0.35)' }
  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#EEECE8',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
  }
  const inputFocusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'rgba(74,222,128,0.3)'
      e.target.style.background = 'rgba(255,255,255,0.06)'
      e.target.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.05)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'rgba(255,255,255,0.08)'
      e.target.style.background = 'rgba(255,255,255,0.04)'
      e.target.style.boxShadow = 'none'
    },
  }

  return (
    <div>
      {/* Header row */}
      <div className="mb-7 flex items-center justify-between">
        <h2
          className="text-lg font-extrabold"
          style={{ color: '#EEECE8', letterSpacing: '-0.02em' }}
        >
          {t('contact.formTitle')}
        </h2>
        <span
          className="text-[10px] font-bold uppercase"
          style={{
            color: '#4ADE80',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.12)',
            borderRadius: '20px',
            padding: '5px 12px',
            letterSpacing: '0.1em',
          }}
        >
          {t('contact.formBadge')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" id="contact-form">
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              border: '1px solid rgba(224,82,82,0.3)',
              background: 'rgba(224,82,82,0.08)',
              color: '#E05252',
            }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass} style={labelStyle}>
              {t('contact.name')}
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full text-sm"
              style={inputStyle}
              {...inputFocusHandlers}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className={labelClass} style={labelStyle}>
              {t('contact.email')}
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full text-sm"
              style={inputStyle}
              {...inputFocusHandlers}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-subject" className={labelClass} style={labelStyle}>
            {t('contact.subject')}
          </label>
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as ContactSubject)}
            className="mt-1.5 w-full appearance-none text-sm"
            style={{
              ...inputStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 12 12'%3E%3Cpath d='M3 4.5l3 3 3-3' stroke='rgba(238,236,232,0.35)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '40px',
            }}
            {...inputFocusHandlers}
          >
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s} value={s} style={{ background: '#1A1917', color: '#EEECE8' }}>
                {t(SUBJECT_KEYS[s])}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass} style={labelStyle}>
            {t('contact.message')}
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('contact.messagePlaceholder')}
            className="mt-1.5 w-full resize-none text-sm"
            style={{
              ...inputStyle,
              ...(message ? {} : { color: 'rgba(238,236,232,0.4)' }),
            }}
            {...inputFocusHandlers}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full text-xs font-bold uppercase disabled:opacity-50"
          style={{
            background: '#4ADE80',
            color: '#0A0908',
            borderRadius: '10px',
            padding: '14px',
            letterSpacing: '0.2em',
            boxShadow: '0 4px 20px rgba(74,222,128,0.2)',
            transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3ECF74'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(74,222,128,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4ADE80'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,222,128,0.2)'
          }}
        >
          {isPending ? t('common.loading') : t('contact.send')}
        </button>
      </form>

      {/* Privacy footer */}
      <div
        className="mt-5 flex items-center gap-2 pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ADE80"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span className="text-[11px]" style={{ color: 'rgba(238,236,232,0.3)' }}>
          {t('contact.privacy')}
        </span>
      </div>
    </div>
  )
}
