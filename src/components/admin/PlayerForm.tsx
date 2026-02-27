'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { createPlayer, updatePlayer } from '@/app/actions/admin-players'
import { POSITIONS, PREFERRED_FEET } from '@/lib/constants'
import { splitName } from '@/lib/utils'
import type { Position, PreferredFoot } from '@/lib/types'

interface PlayerData {
  id?: string
  name?: string
  name_ka?: string
  date_of_birth?: string
  position?: Position
  preferred_foot?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  parent_guardian_contact?: string | null
}

interface PlayerFormProps {
  player?: PlayerData
}

export function PlayerForm({ player }: PlayerFormProps) {
  const router = useRouter()
  const { t } = useLang()
  const isEditing = Boolean(player?.id)

  const nameParts = player?.name ? splitName(player.name) : { first: '', last: '' }
  const nameKaParts = player?.name_ka ? splitName(player.name_ka) : { first: '', last: '' }

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')

    const form = new FormData(e.currentTarget)

    const playerData = {
      first_name: String(form.get('first_name') ?? ''),
      last_name: String(form.get('last_name') ?? ''),
      first_name_ka: String(form.get('first_name_ka') ?? ''),
      last_name_ka: String(form.get('last_name_ka') ?? ''),
      date_of_birth: String(form.get('date_of_birth') ?? ''),
      position: String(form.get('position') ?? '') as Position,
      preferred_foot: (String(form.get('preferred_foot') ?? '') || undefined) as PreferredFoot | undefined,
      height_cm: form.get('height_cm') ? Number(form.get('height_cm')) : undefined,
      weight_kg: form.get('weight_kg') ? Number(form.get('weight_kg')) : undefined,
      parent_guardian_contact: String(form.get('parent_guardian_contact') ?? '') || undefined,
    }

    let result
    if (isEditing) {
      if (!player?.id) {
        setError('Player ID is missing')
        setSaving(false)
        return
      }
      result = await updatePlayer(player.id, playerData)
    } else {
      result = await createPlayer(playerData)
    }

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

      {/* Name fields */}
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.firstName')}
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              required
              defaultValue={nameParts.first}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.lastName')}
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              required
              defaultValue={nameParts.last}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name_ka" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.firstNameKa')}
            </label>
            <input
              type="text"
              id="first_name_ka"
              name="first_name_ka"
              required
              defaultValue={nameKaParts.first}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="last_name_ka" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.lastNameKa')}
            </label>
            <input
              type="text"
              id="last_name_ka"
              name="last_name_ka"
              required
              defaultValue={nameKaParts.last}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Player details */}
      <div className="card space-y-4 p-4">
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
                  {t('foot.' + foot)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </div>
      </div>

      {/* Parent/guardian contact */}
      <div className="card space-y-4 p-4">
        <div>
          <label htmlFor="parent_guardian_contact" className="block text-sm font-medium text-foreground-muted">
            {t('admin.players.parentGuardianContact')}
          </label>
          <input
            type="text"
            id="parent_guardian_contact"
            name="parent_guardian_contact"
            defaultValue={player?.parent_guardian_contact ?? ''}
            placeholder={t('admin.players.parentGuardianContactHint')}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none"
          />
          <p className="mt-1 text-xs text-foreground-muted/70">
            {t('admin.players.parentGuardianContactPrivacy')}
          </p>
        </div>
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
