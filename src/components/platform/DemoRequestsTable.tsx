'use client'

import { useState, useTransition } from 'react'
import { useLang } from '@/hooks/useLang'
import { updateDemoRequestStatus } from '@/app/actions/platform-demo-requests'
import { DEMO_STATUSES } from '@/lib/constants'

interface DemoRequest {
  id: string
  full_name: string
  email: string
  organization: string
  role: string
  country: string
  message: string | null
  status: string
  user_id: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-primary/10 text-primary',
  contacted: 'bg-pos-gk-bg text-pos-gk',
  demo_done: 'bg-pos-st-bg text-pos-st',
  converted: 'bg-pos-mid-bg text-pos-mid',
  declined: 'bg-danger-muted text-danger',
}

export function DemoRequestsTable({ requests }: { requests: DemoRequest[] }) {
  const { t } = useLang()
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <FilterButton
          label={t('platform.demoRequests.filterAll')}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        {DEMO_STATUSES.map((s) => (
          <FilterButton
            key={s}
            label={t(`platform.demoRequests.${s}`)}
            active={filter === s}
            onClick={() => setFilter(s)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-foreground-muted">{t('platform.demoRequests.noRequests')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.organization')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.role')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.country')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.date')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <RequestRow
                  key={req.id}
                  request={req}
                  isExpanded={expandedId === req.id}
                  onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-foreground-muted hover:bg-surface hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )
}

function RequestRow({
  request,
  isExpanded,
  onToggle,
}: {
  request: DemoRequest
  isExpanded: boolean
  onToggle: () => void
}) {
  const { t } = useLang()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState('')

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await updateDemoRequestStatus(request.id, newStatus)
      if (result.success && newStatus === 'converted' && request.user_id) {
        setToast(t('platform.demoRequests.accountApproved'))
        setTimeout(() => setToast(''), 3000)
      }
    })
  }

  const colorClass = STATUS_COLORS[request.status] ?? 'bg-surface text-foreground-muted'

  return (
    <>
      <tr
        className="border-b border-border/50 cursor-pointer hover:bg-surface/50"
        onClick={onToggle}
      >
        <td className="py-3 pr-4">
          <p className="font-medium text-foreground">{request.full_name}</p>
          <p className="text-xs text-foreground-muted">{request.email}</p>
        </td>
        <td className="py-3 pr-4 text-foreground-muted">{request.organization}</td>
        <td className="py-3 pr-4 text-foreground-muted">{request.role}</td>
        <td className="py-3 pr-4 text-foreground-muted">{request.country}</td>
        <td className="py-3 pr-4 text-foreground-muted whitespace-nowrap">
          {new Date(request.created_at).toLocaleDateString()}
        </td>
        <td className="py-3 pr-4">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
          >
            {t(`platform.demoRequests.${request.status}`)}
          </span>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-border/50">
          <td colSpan={6} className="px-4 py-4 bg-surface/30">
            <div className="space-y-4">
              {/* Message */}
              {request.message && (
                <div>
                  <p className="text-xs font-medium text-foreground-muted mb-1">
                    {t('platform.demoRequests.message')}
                  </p>
                  <p className="text-sm text-foreground-secondary">{request.message}</p>
                </div>
              )}

              {/* Status change */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-xs font-medium text-foreground-muted">
                  {t('platform.demoRequests.status')}:
                </label>
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isPending}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
                >
                  {DEMO_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`platform.demoRequests.${s}`)}
                    </option>
                  ))}
                </select>
                {isPending && (
                  <span className="text-xs text-foreground-muted">{t('common.loading')}</span>
                )}
              </div>

              {/* User link info */}
              <div className="text-xs text-foreground-muted">
                {request.user_id ? (
                  <span>User ID: {request.user_id.slice(0, 8)}...</span>
                ) : (
                  <span>{t('platform.demoRequests.noLinkedUser')}</span>
                )}
              </div>

              {/* Toast */}
              {toast && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  {toast}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
