'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { deactivatePlayer, reactivatePlayer } from '@/app/actions/admin-players'

interface PlayerStatusActionsProps {
  playerId: string
  status: string
}

export function PlayerStatusActions({ playerId, status }: PlayerStatusActionsProps) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const result = status === 'active'
      ? await deactivatePlayer(playerId)
      : await reactivatePlayer(playerId)

    if (result.error) {
      console.error(result.error)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`text-xs disabled:opacity-50 ${
        status === 'active'
          ? 'text-yellow-400 hover:text-yellow-300'
          : 'text-green-400 hover:text-green-300'
      }`}
    >
      {status === 'active' ? t('admin.players.markFreeAgent') : t('admin.players.reactivate')}
    </button>
  )
}
