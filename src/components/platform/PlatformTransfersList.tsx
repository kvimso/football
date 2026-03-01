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

function statusBorderColor(status: string | null) {
  switch (status) {
    case 'pending': return 'border-l-yellow-400'
    case 'accepted': return 'border-l-accent'
    case 'declined': return 'border-l-red-400'
    case 'expired': return 'border-l-foreground-muted/50'
    default: return 'border-l-border'
  }
}

export function PlatformTransfersList({ transfers }: { transfers: Transfer[] }) {
  const { t, lang } = useLang()
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
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
        <svg className="h-12 w-12 text-foreground-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <p className="mt-3 text-sm font-medium text-foreground-muted">{t('platform.transfers.noTransfers')}</p>
      </div>
    )
  }

  const statusBadgeColors: Record<string, string> = {
    pending: 'status-badge-pending',
    accepted: 'status-badge-approved',
    declined: 'status-badge-rejected',
    expired: 'status-badge-rejected',
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 animate-slide-in-down">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}
      {transfers.map((transfer) => {
        const playerName = lang === 'ka' ? transfer.player?.name_ka : transfer.player?.name
        const fromClubName = lang === 'ka' ? transfer.from_club?.name_ka : transfer.from_club?.name
        const toClubName = lang === 'ka' ? transfer.to_club?.name_ka : transfer.to_club?.name

        return (
          <div key={transfer.id} className={`flex items-center gap-3 rounded-lg border border-border border-l-4 ${statusBorderColor(transfer.status)} bg-card p-3 transition-all hover:bg-card-hover`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/players/${transfer.player?.slug ?? ''}`} className="text-sm font-medium text-accent hover:underline">
                  {playerName ?? t('common.unknown')}
                </Link>
                {transfer.player?.platform_id && (
                  <span className="font-mono text-[11px] text-foreground-muted/60">{transfer.player.platform_id}</span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
                <span>{fromClubName ?? '—'}</span>
                <svg className="h-3 w-3 text-foreground-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
                <span>{toClubName ?? '—'}</span>
                <span className="text-foreground-muted/30">&middot;</span>
                <span>{transfer.requested_at ? format(new Date(transfer.requested_at), 'MMM d, yyyy') : '—'}</span>
              </div>
            </div>

            <div className="ml-2 flex shrink-0 items-center gap-1.5">
              {transfer.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleAction(transfer.id, 'accept')}
                    disabled={loading === transfer.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                  >
                    {loading === transfer.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-green-400/30 border-t-green-400" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    {t('admin.transfers.accept')}
                  </button>
                  <button
                    onClick={() => handleAction(transfer.id, 'decline')}
                    disabled={loading === transfer.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {loading === transfer.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-red-400/30 border-t-red-400" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    )}
                    {t('admin.transfers.decline')}
                  </button>
                </>
              ) : (
                <span className={`status-badge ${statusBadgeColors[transfer.status ?? ''] ?? ''}`}>
                  {t(`admin.transfers.${transfer.status}`)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
