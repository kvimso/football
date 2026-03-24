'use client'

import { useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { deleteLeague } from '@/app/actions/platform-leagues'

interface DeleteLeagueButtonProps {
  leagueId: string
}

export function DeleteLeagueButton({ leagueId }: DeleteLeagueButtonProps) {
  const { t } = useLang()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm(t('platform.leagues.deleteConfirm'))) return
    setPending(true)
    await deleteLeague(leagueId)
    setPending(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-danger hover:underline disabled:opacity-50"
    >
      {pending ? t('common.loading') : t('common.delete')}
    </button>
  )
}
