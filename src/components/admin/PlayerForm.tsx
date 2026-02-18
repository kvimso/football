'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { createPlayer, updatePlayer } from '@/app/actions/admin-players'
import { POSITIONS, PREFERRED_FEET, PLAYER_STATUSES } from '@/lib/constants'

interface PlayerData {
  id?: string
  name?: string
  name_ka?: string
  date_of_birth?: string
  position?: string
  preferred_foot?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  jersey_number?: number | null
  status?: string
  scouting_report?: string | null
  scouting_report_ka?: string | null
  is_featured?: boolean
}

interface PlayerFormProps {
  player?: PlayerData
}

export function PlayerForm({ player }: PlayerFormProps) {
  const router = useRouter()
  const { t } = useLang()
  const isEditing = Boolean(player?.id)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const playerData = {
      name: form.get('name') as string,
      name_ka: form.get('name_ka') as string,
      date_of_birth: form.get('date_of_birth') as string,
      position: form.get('position') as string,
      preferred_foot: (form.get('preferred_foot') as string) || undefined,
      height_cm: form.get('height_cm') ? Number(form.get('height_cm')) : undefined,
      weight_kg: form.get('weight_kg') ? Number(form.get('weight_kg')) : undefined,
      jersey_number: form.get('jersey_number') ? Number(form.get('jersey_number')) : undefined,
      status: form.get('status') as string,
      scouting_report: (form.get('scouting_report') as string) || undefined,
      scouting_report_ka: (form.get('scouting_report_ka') as string) || undefined,
      is_featured: form.get('is_featured') === 'on',
    }

    const result = isEditing
      ? await updatePlayer(player!.id!, playerData)
      : await createPlayer(playerData)

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/admin/players')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.name')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={player?.name ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="name_ka" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.nameKa')}
            </label>
            <input
              type="text"
              id="name_ka"
              name="name_ka"
              required
              defaultValue={player?.name_ka ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.dateOfBirth')}
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              required
              defaultValue={player?.date_of_birth ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.position')}
            </label>
            <select
              id="position"
              name="position"
              required
              defaultValue={player?.position ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="">{t('players.allPositions')}</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {t(`positions.${pos}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="preferred_foot" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.preferredFoot')}
            </label>
            <select
              id="preferred_foot"
              name="preferred_foot"
              defaultValue={player?.preferred_foot ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              <option value="">{t('players.allFeet')}</option>
              {PREFERRED_FEET.map((foot) => (
                <option key={foot} value={foot}>
                  {foot}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="height_cm" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.height')}
            </label>
            <input
              type="number"
              id="height_cm"
              name="height_cm"
              min={100}
              max={220}
              defaultValue={player?.height_cm ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="weight_kg" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.weight')}
            </label>
            <input
              type="number"
              id="weight_kg"
              name="weight_kg"
              min={30}
              max={150}
              defaultValue={player?.weight_kg ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="jersey_number" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.jerseyNumber')}
            </label>
            <input
              type="number"
              id="jersey_number"
              name="jersey_number"
              min={1}
              max={99}
              defaultValue={player?.jersey_number ?? ''}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.status')}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={player?.status ?? 'active'}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            >
              {PLAYER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.players.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_featured"
            name="is_featured"
            defaultChecked={player?.is_featured ?? false}
            className="h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent"
          />
          <label htmlFor="is_featured" className="text-sm text-foreground-muted">
            {t('players.featured')}
          </label>
        </div>
      </div>

      {/* Scouting reports */}
      <div className="card space-y-4 p-4">
        <h3 className="text-sm font-semibold text-foreground">{t('admin.players.scoutingReport')}</h3>
        <textarea
          name="scouting_report"
          rows={3}
          defaultValue={player?.scouting_report ?? ''}
          placeholder={t('admin.players.scoutingReport')}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
        />
        <textarea
          name="scouting_report_ka"
          rows={3}
          defaultValue={player?.scouting_report_ka ?? ''}
          placeholder={t('admin.players.scoutingReportKa')}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {saving ? t('common.loading') : t('admin.common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('admin.common.cancel')}
        </button>
      </div>
    </form>
  )
}
