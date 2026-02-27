'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { platformCreatePlayer, platformUpdatePlayer } from '@/app/actions/platform-players'
import { POSITIONS, PREFERRED_FEET } from '@/lib/constants'
import { splitName } from '@/lib/utils'

interface PlayerData {
  id?: string
  name?: string
  name_ka?: string
  date_of_birth?: string
  position?: string
  preferred_foot?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  parent_guardian_contact?: string | null
  club_id?: string | null
  status?: string | null
}

interface Club {
  id: string
  name: string
}

interface PlatformPlayerFormProps {
  player?: PlayerData
  clubs: Club[]
}

export function PlatformPlayerForm({ player, clubs }: PlatformPlayerFormProps) {
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
      first_name: form.get('first_name') as string,
      last_name: form.get('last_name') as string,
      first_name_ka: form.get('first_name_ka') as string,
      last_name_ka: form.get('last_name_ka') as string,
      date_of_birth: form.get('date_of_birth') as string,
      position: form.get('position') as string,
      preferred_foot: (form.get('preferred_foot') as string) || undefined,
      height_cm: form.get('height_cm') ? Number(form.get('height_cm')) : undefined,
      weight_kg: form.get('weight_kg') ? Number(form.get('weight_kg')) : undefined,
      parent_guardian_contact: (form.get('parent_guardian_contact') as string) || undefined,
      club_id: (form.get('club_id') as string) || '',
      status: (form.get('status') as string) || undefined,
    }

    const result = isEditing
      ? await platformUpdatePlayer(player!.id!, playerData)
      : await platformCreatePlayer(playerData)

    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/platform/players')
      router.refresh()
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:border-accent focus:outline-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Club & Status */}
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="club_id" className="block text-sm font-medium text-foreground-muted">
              {t('platform.players.club')}
            </label>
            <select
              id="club_id"
              name="club_id"
              defaultValue={player?.club_id ?? ''}
              className={inputClass}
            >
              <option value="">{t('platform.players.noClub')}</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.status')}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={player?.status ?? 'active'}
              className={inputClass}
            >
              <option value="active">{t('admin.players.active')}</option>
              <option value="free_agent">{t('admin.players.free_agent')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Name fields */}
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.firstName')}
            </label>
            <input type="text" id="first_name" name="first_name" required defaultValue={nameParts.first} className={inputClass} />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.lastName')}
            </label>
            <input type="text" id="last_name" name="last_name" required defaultValue={nameParts.last} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name_ka" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.firstNameKa')}
            </label>
            <input type="text" id="first_name_ka" name="first_name_ka" required defaultValue={nameKaParts.first} className={inputClass} />
          </div>
          <div>
            <label htmlFor="last_name_ka" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.lastNameKa')}
            </label>
            <input type="text" id="last_name_ka" name="last_name_ka" required defaultValue={nameKaParts.last} className={inputClass} />
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
            <input type="date" id="date_of_birth" name="date_of_birth" required defaultValue={player?.date_of_birth ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.position')}
            </label>
            <select id="position" name="position" required defaultValue={player?.position ?? ''} className={inputClass}>
              <option value="">{t('players.allPositions')}</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>{t(`positions.${pos}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="preferred_foot" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.preferredFoot')}
            </label>
            <select id="preferred_foot" name="preferred_foot" defaultValue={player?.preferred_foot ?? ''} className={inputClass}>
              <option value="">{t('players.allFeet')}</option>
              {PREFERRED_FEET.map((foot) => (
                <option key={foot} value={foot}>{t('foot.' + foot)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="height_cm" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.height')}
            </label>
            <input type="number" id="height_cm" name="height_cm" min={100} max={220} defaultValue={player?.height_cm ?? ''} className={inputClass} />
          </div>
          <div>
            <label htmlFor="weight_kg" className="block text-sm font-medium text-foreground-muted">
              {t('admin.players.weight')}
            </label>
            <input type="number" id="weight_kg" name="weight_kg" min={30} max={150} defaultValue={player?.weight_kg ?? ''} className={inputClass} />
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
            className={inputClass}
          />
          <p className="mt-1 text-xs text-foreground-muted/70">
            {t('admin.players.parentGuardianContactPrivacy')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
          {saving ? t('common.loading') : t('common.save')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  )
}
