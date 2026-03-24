'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { AGE_GROUPS } from '@/lib/constants'
import { createLeague, updateLeague } from '@/app/actions/platform-leagues'

interface LeagueFormProps {
  league?: {
    id: string
    name: string
    name_ka: string
    age_group: string
    season: string
    starlive_url: string
    description: string | null
    description_ka: string | null
    logo_url: string | null
    is_active: boolean
    display_order: number
  }
}

export function LeagueForm({ league }: LeagueFormProps) {
  const { t } = useLang()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: String(formData.get('name') ?? ''),
      name_ka: String(formData.get('name_ka') ?? ''),
      age_group: String(formData.get('age_group') ?? 'U15') as (typeof AGE_GROUPS)[number],
      season: String(formData.get('season') ?? ''),
      starlive_url: String(formData.get('starlive_url') ?? ''),
      description: String(formData.get('description') ?? ''),
      description_ka: String(formData.get('description_ka') ?? ''),
      logo_url: String(formData.get('logo_url') ?? ''),
      is_active: formData.get('is_active') === 'on',
      display_order: Number(formData.get('display_order') ?? 0),
    }

    const result = league ? await updateLeague(league.id, data) : await createLeague(data)

    setSaving(false)

    if (result.error) {
      setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
    } else {
      router.push('/platform/leagues')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger-muted p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.leagues.name')}
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={league?.name ?? ''}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.leagues.nameKa')}
          </label>
          <input
            name="name_ka"
            type="text"
            required
            defaultValue={league?.name_ka ?? ''}
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.leagues.ageGroup')}
          </label>
          <select
            name="age_group"
            required
            defaultValue={league?.age_group ?? 'U15'}
            className="input w-full"
          >
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.leagues.season')}
          </label>
          <input
            name="season"
            type="text"
            required
            placeholder="2025-26"
            defaultValue={league?.season ?? ''}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t('platform.leagues.displayOrder')}
          </label>
          <input
            name="display_order"
            type="number"
            min={0}
            defaultValue={league?.display_order ?? 0}
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.leagues.starliveUrl')}
        </label>
        <input
          name="starlive_url"
          type="url"
          required
          placeholder="https://starlive.com/..."
          defaultValue={league?.starlive_url ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.leagues.description')}
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={league?.description ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.leagues.descriptionKa')}
        </label>
        <textarea
          name="description_ka"
          rows={3}
          defaultValue={league?.description_ka ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.leagues.logoUrl')}
        </label>
        <input
          name="logo_url"
          type="url"
          defaultValue={league?.logo_url ?? ''}
          className="input w-full"
          placeholder="https://"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={league?.is_active ?? true}
          className="h-4 w-4 rounded border-border text-primary"
        />
        <label className="text-sm font-medium text-foreground">
          {t('platform.leagues.active')}
        </label>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/platform/leagues')}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
