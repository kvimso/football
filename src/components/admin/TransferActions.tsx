'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { acceptTransfer, declineTransfer } from '@/app/actions/admin-transfers'

interface TransferActionsProps {
  requestId: string
}

export function TransferActions({ requestId }: TransferActionsProps) {
  const { t } = useLang()
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<'accept' | 'decline' | null>(null)

  async function handleAction(action: 'accept' | 'decline') {
    setLoadingAction(action)
    const result = action === 'accept'
      ? await acceptTransfer(requestId)
      : await declineTransfer(requestId)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
    setLoadingAction(null)
  }

  const isLoading = loadingAction !== null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('accept')}
        disabled={isLoading}
        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
      >
        {loadingAction === 'accept' ? t('common.loading') : t('admin.transfers.accept')}
      </button>
      <button
        onClick={() => handleAction('decline')}
        disabled={isLoading}
        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
      >
        {loadingAction === 'decline' ? t('common.loading') : t('admin.transfers.decline')}
      </button>
    </div>
  )
}
