'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { createClub, updateClub } from '@/app/actions/platform-clubs'

interface ClubFormProps {
  club?: {
    id: string
    name: string
    name_ka: string
    city: string | null
    region: string | null
    description: string | null
    description_ka: string | null
    website: string | null
  }
}

export function ClubForm({ club }: ClubFormProps) {
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
      city: String(formData.get('city') ?? ''),
      region: String(formData.get('region') ?? ''),
      description: String(formData.get('description') ?? ''),
      description_ka: String(formData.get('description_ka') ?? ''),
      website: String(formData.get('website') ?? ''),
    }

    const result = club
      ? await updateClub(club.id, data)
      : await createClub(data)

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/platform/clubs')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.name')}</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={club?.name ?? ''}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.nameKa')}</label>
          <input
            name="name_ka"
            type="text"
            required
            defaultValue={club?.name_ka ?? ''}
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.city')}</label>
          <input
            name="city"
            type="text"
            defaultValue={club?.city ?? ''}
            className="input w-full"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.region')}</label>
          <input
            name="region"
            type="text"
            defaultValue={club?.region ?? ''}
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.description')}</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={club?.description ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.descriptionKa')}</label>
        <textarea
          name="description_ka"
          rows={3}
          defaultValue={club?.description_ka ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">{t('platform.clubs.website')}</label>
        <input
          name="website"
          type="url"
          defaultValue={club?.website ?? ''}
          className="input w-full"
          placeholder="https://"
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/platform/clubs')}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
