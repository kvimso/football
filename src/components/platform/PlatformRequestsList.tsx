'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { platformApproveRequest, platformRejectRequest } from '@/app/actions/platform-requests'
import { format } from 'date-fns'

interface Request {
  id: string
  message: string | null
  status: string | null
  created_at: string | null
  scout: { full_name: string | null; organization: string | null; email: string | null } | null
  player: { name: string; name_ka: string | null; slug: string; club: { name: string } | { name: string }[] | null } | null
}

export function PlatformRequestsList({ requests }: { requests: Request[] }) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setLoading(requestId)
    const result = action === 'approve'
      ? await platformApproveRequest(requestId)
      : await platformRejectRequest(requestId)

    if (result.error) {
      alert(result.error)
    }
    setLoading(null)
    router.refresh()
  }

  if (requests.length === 0) {
    return <p className="text-sm text-foreground-muted">{t('platform.requests.noRequests')}</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const club = req.player?.club
          ? Array.isArray(req.player.club) ? req.player.club[0] : req.player.club
          : null
        return (
          <div key={req.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {req.scout?.full_name ?? 'Unknown Scout'}
                  </p>
                  {req.scout?.organization && (
                    <span className="text-xs text-foreground-muted">({req.scout.organization})</span>
                  )}
                  <span className="text-foreground-muted">&rarr;</span>
                  <Link href={`/players/${req.player?.slug ?? ''}`} className="text-sm text-accent hover:underline">
                    {req.player?.name ?? 'Unknown'}
                  </Link>
                  {club?.name && (
                    <span className="text-xs text-foreground-muted">({club.name})</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  {req.message?.slice(0, 120)}{(req.message?.length ?? 0) > 120 ? '...' : ''}
                </p>
                <p className="mt-1 text-xs text-foreground-muted/70">
                  {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {req.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={loading === req.id}
                      className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                    >
                      {t('admin.requests.approve')}
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={loading === req.id}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      {t('admin.requests.reject')}
                    </button>
                  </>
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
