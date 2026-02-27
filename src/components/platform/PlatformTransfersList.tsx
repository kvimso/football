'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLang } from '@/hooks/useLang'
import { platformAcceptTransfer, platformDeclineTransfer } from '@/app/actions/platform-transfers'
import { format } from 'date-fns'

interface Transfer {
  id: string
  status: string | null
  requested_at: string | null
  resolved_at: string | null
  expires_at: string | null
  player: { name: string; name_ka: string | null; slug: string; platform_id: string | null } | null
  from_club: { name: string; name_ka: string | null } | null
  to_club: { name: string; name_ka: string | null } | null
}

export function PlatformTransfersList({ transfers }: { transfers: Transfer[] }) {
  const { t } = useLang()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAction(requestId: string, action: 'accept' | 'decline') {
    setLoading(requestId)
    setError(null)
    const result = action === 'accept'
      ? await platformAcceptTransfer(requestId)
      : await platformDeclineTransfer(requestId)

    if (result.error) {
      setError(result.error.startsWith('errors.') ? t(result.error) : result.error)
    }
    setLoading(null)
    router.refresh()
  }

  if (transfers.length === 0) {
    return <p className="text-sm text-foreground-muted">{t('platform.transfers.noTransfers')}</p>
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    accepted: 'bg-green-500/10 text-green-400',
    declined: 'bg-red-500/10 text-red-400',
    expired: 'bg-gray-500/10 text-gray-400',
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {transfers.map((transfer) => (
        <div key={transfer.id} className="card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/players/${transfer.player?.slug ?? ''}`} className="text-sm font-medium text-accent hover:underline">
                  {transfer.player?.name ?? t('common.unknown')}
                </Link>
                {transfer.player?.platform_id && (
                  <span className="font-mono text-xs text-foreground-muted">{transfer.player.platform_id}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                {transfer.from_club?.name ?? '—'} &rarr; {transfer.to_club?.name ?? '—'}
              </p>
              <p className="mt-1 text-xs text-foreground-muted/70">
                {t('admin.transfers.requestedOn')}: {transfer.requested_at ? format(new Date(transfer.requested_at), 'MMM d, yyyy') : '—'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {transfer.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleAction(transfer.id, 'accept')}
                    disabled={loading === transfer.id}
                    className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                  >
                    {t('admin.transfers.accept')}
                  </button>
                  <button
                    onClick={() => handleAction(transfer.id, 'decline')}
                    disabled={loading === transfer.id}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    {t('admin.transfers.decline')}
                  </button>
                </>
              ) : (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[transfer.status ?? ''] ?? ''}`}>
                  {t(`admin.transfers.${transfer.status}`)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
