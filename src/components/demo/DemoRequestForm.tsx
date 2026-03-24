'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useLang } from '@/hooks/useLang'
import { submitDemoRequest } from '@/app/actions/submit-demo-request'
import { DEMO_ROLES, SCOUT_COUNTRIES } from '@/lib/constants'
import { demoRequestFormSchema } from '@/lib/validations'
import type { DemoStatus } from '@/lib/types'

interface DemoRequestFormProps {
  defaultEmail?: string
  existingStatus?: DemoStatus | null
}

export function DemoRequestForm({ defaultEmail, existingStatus }: DemoRequestFormProps) {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [organization, setOrganization] = useState('')
  const [role, setRole] = useState('')
  const [country, setCountry] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const mountTimeRef = useRef(0)

  // Initialize mount time on first render (client-side only)
  useEffect(() => {
    mountTimeRef.current = Date.now()
  }, [])

  // If user already has a demo request, show status instead of form
  if (existingStatus) {
    const statusKey =
      `demo.status${existingStatus.charAt(0).toUpperCase()}${existingStatus.slice(1).replace(/_(\w)/g, (_, c: string) => c.toUpperCase())}` as
        | 'demo.statusNew'
        | 'demo.statusContacted'
        | 'demo.statusDemoDone'
        | 'demo.statusDeclined'

    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">{t('demo.alreadySubmitted')}</h2>
        <p className="mt-3 text-sm text-foreground-muted">{t(statusKey)}</p>
        {existingStatus === 'declined' && (
          <p className="mt-2 text-sm text-foreground-muted">
            <a href="mailto:info@gft.ge" className="font-medium text-primary hover:underline">
              info@gft.ge
            </a>
          </p>
        )}
      </div>
    )
  }

  if (sent) {
    return (
      <div className="text-center py-8">
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
        <h2 className="text-xl font-bold text-foreground">{t('demo.successTitle')}</h2>
        <p className="mt-2 text-sm text-foreground-muted">{t('demo.successMessage')}</p>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const honeypot = formData.get('website') as string
    const timeDiff = Date.now() - mountTimeRef.current

    // Time-based detection: reject submissions < 2 seconds after render
    if (timeDiff < 2000) return

    const data = {
      full_name: fullName,
      email,
      organization,
      role: role as (typeof DEMO_ROLES)[number],
      country,
      message: message || undefined,
    }

    const parsed = demoRequestFormSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.invalidInput'))
      return
    }

    startTransition(async () => {
      const result = await submitDemoRequest(parsed.data, honeypot || undefined)
      if ('error' in result && result.error) {
        setError(t(result.error))
      } else {
        setSent(true)
      }
    })
  }

  const inputClasses =
    'mt-1 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="website"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
      />

      <div>
        <label htmlFor="demo-name" className="block text-sm font-medium text-foreground-muted">
          {t('demo.formName')}
        </label>
        <input
          id="demo-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="demo-email" className="block text-sm font-medium text-foreground-muted">
          {t('demo.formEmail')}
        </label>
        <input
          id="demo-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="demo-org" className="block text-sm font-medium text-foreground-muted">
          {t('demo.formOrganization')}
        </label>
        <input
          id="demo-org"
          type="text"
          required
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="demo-role" className="block text-sm font-medium text-foreground-muted">
            {t('demo.formRole')}
          </label>
          <select
            id="demo-role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClasses}
          >
            <option value="">{t('demo.selectRole')}</option>
            {DEMO_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="demo-country" className="block text-sm font-medium text-foreground-muted">
            {t('demo.formCountry')}
          </label>
          <select
            id="demo-country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClasses}
          >
            <option value="">{t('demo.selectCountry')}</option>
            {SCOUT_COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="demo-message" className="block text-sm font-medium text-foreground-muted">
          {t('demo.formMessage')}
        </label>
        <textarea
          id="demo-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('demo.formMessagePlaceholder')}
          className={`${inputClasses} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full py-3 text-base disabled:opacity-50"
      >
        {isPending ? t('demo.submitting') : t('demo.submit')}
      </button>
    </form>
  )
}
