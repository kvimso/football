'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { inviteAcademyAdmin } from '@/app/actions/admin-invite'

interface Club {
  id: string
  name: string
  name_ka: string
}

interface InviteFormProps {
  clubs: Club[]
}

export function InviteForm({ clubs }: InviteFormProps) {
  const { t, lang } = useLang()
  const [email, setEmail] = useState('')
  const [clubId, setClubId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    setSuccess('')

    const result = await inviteAcademyAdmin({ email, clubId })

    if (result.error) {
      setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
    } else {
      setSuccess(result.message ?? t('admin.invite.sent'))
      setEmail('')
      setClubId('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

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
          className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
          placeholder="admin@academy.ge"
        />
      </div>

      <div>
        <label htmlFor="club" className="block text-sm font-medium text-foreground-muted">
          {t('players.club')}
        </label>
        <select
          id="club"
          required
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background-secondary px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
        >
          <option value="">{t('admin.invite.selectClub')}</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {lang === 'ka' && club.name_ka ? club.name_ka : club.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !email || !clubId}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? t('common.loading') : t('admin.invite.sendInvite')}
      </button>
    </form>
  )
}
