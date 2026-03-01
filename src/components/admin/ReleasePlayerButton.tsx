'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { releasePlayer } from '@/app/actions/admin-transfers'

interface ReleasePlayerButtonProps {
  playerId: string
  playerName: string
}

export function ReleasePlayerButton({ playerId, playerName }: ReleasePlayerButtonProps) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleRelease() {
    const confirmed = window.confirm(
      t('admin.transfers.confirmRelease').replace('{name}', playerName)
    )
    if (!confirmed) return

    setLoading(true)
    setErrorMsg('')
    const result = await releasePlayer(playerId)
    if (result.error) {
      setErrorMsg(result.error.startsWith('errors.') ? t(result.error) : result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button
      onClick={handleRelease}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? t('common.loading') : t('admin.transfers.release')}
    </button>
      {errorMsg && (
        <span className="text-xs text-red-400">{errorMsg}</span>
      )}
    </>
  )
}
