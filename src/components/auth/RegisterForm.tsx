'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/hooks/useLang'

export function RegisterForm() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [organization, setOrganization] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl">
            &#9993;
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('auth.checkEmail')}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{email}</p>
          <Link href="/login" className="btn-primary mt-6 inline-block">
            {t('auth.signInLink')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-foreground">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('auth.orContinue')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground-muted">
              {t('auth.fullName')}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground-muted">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground-muted">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-foreground-muted">
              {t('auth.organization')}
            </label>
            <input
              id="organization"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={t('auth.organizationHint')}
              className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground placeholder-foreground-muted outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.registerButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="text-accent hover:underline">
            {t('auth.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
