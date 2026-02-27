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
  const [showApproveForm, setShowApproveForm] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')

  async function handleReject() {
    setLoading(true)
    const result = await rejectRequest(requestId)
    if (result.error) {
      console.error(result.error)
    }
    setLoading(false)
    router.refresh()
  }

  async function handleApproveConfirm() {
    setLoading(true)
    const result = await approveRequest(requestId, responseMessage.trim() || undefined)
    if (result.error) {
      console.error(result.error)
    }
    setLoading(false)
    setShowApproveForm(false)
    router.refresh()
  }

  if (showApproveForm) {
    return (
      <div className="flex flex-col gap-2 min-w-[240px]">
        <textarea
          value={responseMessage}
          onChange={(e) => setResponseMessage(e.target.value)}
          placeholder={t('admin.requests.responseMessagePlaceholder')}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-alt p-2 text-xs text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none resize-none"
        />
        <p className="text-[10px] text-foreground-muted/50">{t('admin.requests.responseMessageHint')}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApproveConfirm}
            disabled={loading}
            className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
          >
            {t('admin.requests.confirmApproveWithMessage')}
          </button>
          <button
            onClick={() => { setShowApproveForm(false); setResponseMessage('') }}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            {t('admin.requests.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShowApproveForm(true)}
        disabled={loading}
        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
      >
        {t('admin.requests.approve')}
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
      >
        {t('admin.requests.reject')}
      </button>
    </div>
  )
}
