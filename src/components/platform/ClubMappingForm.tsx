'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import {
  createClubMapping,
  updateClubMapping,
  deleteClubMapping,
} from '@/app/actions/platform-camera'

interface ClubMappingFormProps {
  mapping?: {
    id: string
    club_id: string
    starlive_team_name: string
    starlive_team_id: number | null
  }
  clubs: Array<{ id: string; name: string; name_ka: string }>
}

export function ClubMappingForm({ mapping, clubs }: ClubMappingFormProps) {
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
      club_id: String(formData.get('club_id') ?? ''),
      starlive_team_name: String(formData.get('starlive_team_name') ?? ''),
      starlive_team_id: formData.get('starlive_team_id')
        ? Number(formData.get('starlive_team_id'))
        : null,
    }

    const result = mapping
      ? await updateClubMapping(mapping.id, data)
      : await createClubMapping(data)

    setSaving(false)

    if (!result.success) {
      setError(result.error.startsWith('platform.') ? t(result.error) : result.error)
    } else {
      router.push('/platform/camera/clubs')
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

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.camera.clubs.clubName')}
        </label>
        <select
          name="club_id"
          required
          defaultValue={mapping?.club_id ?? ''}
          className="input w-full"
        >
          <option value="">{t('platform.players.selectClub')}</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} / {club.name_ka}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.camera.clubs.starliveTeamName')}
        </label>
        <input
          name="starlive_team_name"
          type="text"
          required
          defaultValue={mapping?.starlive_team_name ?? ''}
          className="input w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('platform.camera.clubs.starliveTeamId')}
        </label>
        <input
          name="starlive_team_id"
          type="number"
          defaultValue={mapping?.starlive_team_id ?? ''}
          className="input w-full"
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.push('/platform/camera/clubs')}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}

// Delete button (used in list page)
export function DeleteClubMappingButton({
  mappingId,
  affectedCount = 0,
}: {
  mappingId: string
  affectedCount?: number
}) {
  const { t } = useLang()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    const msg =
      affectedCount > 0
        ? `${t('platform.camera.clubs.deleteConfirm')}\n\n${affectedCount} ${t('platform.camera.clubs.affectedPlayerMappings')}`
        : t('platform.camera.clubs.deleteConfirm')
    if (!confirm(msg)) return
    setDeleting(true)
    const result = await deleteClubMapping(mappingId)
    setDeleting(false)
    if (result.success) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-danger hover:underline disabled:opacity-50"
    >
      {deleting ? '...' : t('common.delete')}
    </button>
  )
}
