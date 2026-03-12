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
  const [errorMsg, setErrorMsg] = useState('')

  async function handleAction(action: 'accept' | 'decline') {
    setLoadingAction(action)
    setErrorMsg('')
    const result =
      action === 'accept' ? await acceptTransfer(requestId) : await declineTransfer(requestId)

    if (result.error) {
      setErrorMsg(result.error.startsWith('errors.') ? t(result.error) : result.error)
    } else {
      router.refresh()
    }
    setLoadingAction(null)
  }

  const isLoading = loadingAction !== null

  return (
    <div className="flex items-center gap-2">
      {errorMsg && <span className="text-[10px] text-red-600">{errorMsg}</span>}
      <button
        onClick={() => handleAction('accept')}
        disabled={isLoading}
        title={t('admin.transfers.accept')}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-700 transition-all hover:bg-green-500/20 disabled:opacity-50"
      >
        {loadingAction === 'accept' ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400/30 border-t-green-400" />
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </button>
      <button
        onClick={() => handleAction('decline')}
        disabled={isLoading}
        title={t('admin.transfers.decline')}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 transition-all hover:bg-red-500/20 disabled:opacity-50"
      >
        {loadingAction === 'decline' ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  )
}
