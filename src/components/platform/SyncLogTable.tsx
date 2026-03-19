'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/hooks/useLang'
import { getSyncLogErrors } from '@/app/actions/platform-camera'

interface SyncLogEntry {
  id: string
  sync_type: string
  starlive_id: string | null
  status: string
  records_synced: number | null
  records_skipped: number | null
  duration_ms: number | null
  triggered_by: string | null
  created_at: string | null
}

interface SyncLogTableProps {
  logs: SyncLogEntry[]
  page: number
  hasMore: boolean
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === 'success'
      ? 'status-badge-active'
      : status === 'partial'
        ? 'status-badge-pending'
        : 'status-badge-rejected'

  return <span className={className}>{status}</span>
}

function ExpandableErrors({ logId }: { logId: string }) {
  const { t } = useLang()
  const [errors, setErrors] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadErrors() {
    if (errors !== null) return // Already loaded
    setLoading(true)
    const result = await getSyncLogErrors(logId)
    if ('errors' in result) {
      setErrors(result.errors)
    }
    setLoading(false)
  }

  return (
    <details
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) loadErrors()
      }}
    >
      <summary className="cursor-pointer text-primary text-xs hover:underline">
        {t('platform.camera.sync.viewErrors')}
      </summary>
      <div className="mt-2">
        {loading && <p className="text-xs text-foreground-muted">{t('common.loading')}</p>}
        {errors !== null && errors.length === 0 && (
          <p className="text-xs text-foreground-muted">No errors recorded</p>
        )}
        {errors !== null && errors.length > 0 && (
          <ul className="space-y-1 text-xs text-foreground-muted">
            {errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

export function SyncLogTable({ logs, page, hasMore }: SyncLogTableProps) {
  const { t } = useLang()

  if (logs.length === 0) {
    return <p className="mt-4 text-sm text-foreground-muted">{t('platform.camera.sync.noLogs')}</p>
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground-muted">
              <th className="pb-3 pr-4 font-medium">{t('platform.camera.sync.timestamp')}</th>
              <th className="pb-3 pr-4 font-medium">{t('platform.camera.sync.type')}</th>
              <th className="pb-3 pr-4 font-medium">{t('platform.camera.sync.status')}</th>
              <th className="pb-3 pr-4 font-medium text-center">
                {t('platform.camera.sync.synced')}
              </th>
              <th className="pb-3 pr-4 font-medium text-center">
                {t('platform.camera.sync.skipped')}
              </th>
              <th className="pb-3 pr-4 font-medium">{t('platform.camera.sync.duration')}</th>
              <th className="pb-3 pr-4 font-medium">{t('platform.camera.sync.triggeredBy')}</th>
              <th className="pb-3 font-medium">{t('platform.camera.sync.details')}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/50">
                <td className="py-3 pr-4 text-foreground-muted whitespace-nowrap">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                </td>
                <td className="py-3 pr-4 text-foreground">{log.sync_type}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={log.status} />
                </td>
                <td className="py-3 pr-4 text-center text-foreground">{log.records_synced ?? 0}</td>
                <td className="py-3 pr-4 text-center text-foreground-muted">
                  {log.records_skipped ?? 0}
                </td>
                <td className="py-3 pr-4 text-foreground-muted whitespace-nowrap">
                  {log.duration_ms != null ? `${log.duration_ms}ms` : '—'}
                </td>
                <td className="py-3 pr-4 text-foreground-muted">{log.triggered_by ?? '—'}</td>
                <td className="py-3">
                  <ExpandableErrors logId={log.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-foreground-muted">Page {page}</div>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/platform/camera/sync?page=${page - 1}`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('platform.camera.sync.prev')}
            </Link>
          )}
          {hasMore && (
            <Link
              href={`/platform/camera/sync?page=${page + 1}`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              {t('platform.camera.sync.next')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
