'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { approveRequest, rejectRequest } from '@/app/actions/admin-requests'

interface RequestActionsProps {
  requestId: string
}

export function RequestActions({ requestId }: RequestActionsProps) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(true)
    const result = action === 'approve'
      ? await approveRequest(requestId)
      : await rejectRequest(requestId)

    if (result.error) {
      console.error(result.error)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={loading}
        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
      >
        {t('admin.requests.approve')}
      </button>
      <button
        onClick={() => handleAction('reject')}
        disabled={loading}
        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
      >
        {t('admin.requests.reject')}
      </button>
    </div>
  )
}
