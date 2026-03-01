'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { unwrapRelation } from '@/lib/utils'
import { platformApproveRequest, platformRejectRequest } from '@/app/actions/platform-requests'
import { format } from 'date-fns'

interface Request {
  id: string
  message: string | null
  status: string | null
  created_at: string | null
  expires_at: string | null
  response_message: string | null
  scout: { full_name: string | null; organization: string | null; email: string | null } | null
  player: { name: string; name_ka: string | null; slug: string; club: { name: string } | { name: string }[] | null } | null
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export function PlatformRequestsList({ requests }: { requests: Request[] }) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approveFormId, setApproveFormId] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')

  async function handleApproveConfirm(requestId: string) {
    setLoading(requestId)
    setError(null)
    const result = await platformApproveRequest(requestId, responseMessage.trim() || undefined)
    if (result.error) {
      setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
    }
    setLoading(null)
    setApproveFormId(null)
    setResponseMessage('')
    router.refresh()
  }

  async function handleReject(requestId: string) {
    setLoading(requestId)
    setError(null)
    const result = await platformRejectRequest(requestId)
    if (result.error) {
      setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
    }
    setLoading(null)
    router.refresh()
  }

  if (requests.length === 0) {
    return <p className="text-sm text-foreground-muted">{t('platform.requests.noRequests')}</p>
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {requests.map((req) => {
        const club = req.player?.club
          ? unwrapRelation(req.player.club)
          : null
        const expired = req.status === 'pending' && isExpired(req.expires_at)
        const daysUntilExpiry = req.expires_at ? getDaysUntil(req.expires_at) : null
        const daysSent = req.created_at ? getDaysSince(req.created_at) : 0

        return (
          <div key={req.id} className={`card p-4 ${expired ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {req.scout?.full_name ?? t('common.unknownScout')}
                  </p>
                  {req.scout?.organization && (
                    <span className="text-xs text-foreground-muted">({req.scout.organization})</span>
                  )}
                  <span className="text-foreground-muted">&rarr;</span>
                  <Link href={`/players/${req.player?.slug ?? ''}`} className="text-sm text-accent hover:underline">
                    {req.player?.name ?? t('common.unknown')}
                  </Link>
                  {club?.name && (
                    <span className="text-xs text-foreground-muted">({club.name})</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {req.message?.slice(0, 120)}{(req.message?.length ?? 0) > 120 ? '...' : ''}
                </p>

                {/* Urgency badges for pending requests */}
                {req.status === 'pending' && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {expired ? (
                      <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-medium text-gray-400">
                        {t('admin.requests.expired')}
                      </span>
                    ) : daysUntilExpiry !== null && daysUntilExpiry <= 1 ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        {t('admin.requests.expiresTomorrow')}
                      </span>
                    ) : daysUntilExpiry !== null && daysUntilExpiry <= 7 ? (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                        {t('admin.requests.expiringSoon').replace('{days}', String(daysUntilExpiry))}
                      </span>
                    ) : (
                      <span className="text-xs text-foreground-muted/70">
                        {t('admin.requests.sentDaysAgo').replace('{days}', String(daysSent))}
                      </span>
                    )}
                  </div>
                )}

                {/* Response message display */}
                {req.response_message && req.status !== 'pending' && (
                  <div className="mt-1.5 rounded-lg bg-surface-alt/50 p-2">
                    <p className="text-xs text-foreground-muted">{req.response_message}</p>
                  </div>
                )}

                <p className="mt-1 text-xs text-foreground-muted/70">
                  {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {req.status === 'pending' && !expired ? (
                  approveFormId === req.id ? (
                    <div className="flex flex-col gap-2 min-w-[240px]">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder={t('admin.requests.responseMessagePlaceholder')}
                        maxLength={500}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-surface-alt p-2 text-xs text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:outline-none resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveConfirm(req.id)}
                          disabled={loading === req.id}
                          className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                        >
                          {t('admin.requests.confirmApproveWithMessage')}
                        </button>
                        <button
                          onClick={() => { setApproveFormId(null); setResponseMessage('') }}
                          disabled={loading === req.id}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
                        >
                          {t('admin.requests.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setApproveFormId(req.id); setResponseMessage('') }}
                        disabled={loading === req.id}
                        className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                      >
                        {t('admin.requests.approve')}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={loading === req.id}
                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {t('admin.requests.reject')}
                      </button>
                    </>
                  )
                ) : req.status === 'pending' && expired ? (
                  <span className="rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                    {t('admin.requests.expired')}
                  </span>
                ) : (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    req.status === 'approved'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {t(`admin.requests.${req.status}`)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
