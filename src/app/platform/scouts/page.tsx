import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'
import { ApprovalButton } from '@/components/platform/ApprovalButton'

export default async function PlatformScoutsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: scouts, error } = await admin
    .from('profiles')
    .select('id, full_name, email, organization, country, is_approved, created_at')
    .eq('role', 'scout')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to fetch scouts:', error.message)

  const items = scouts ?? []
  const pendingCount = items.filter((s) => !s.is_approved).length
  const approvedCount = items.filter((s) => s.is_approved).length

  const scoutIds = items.map((s) => s.id)

  // Get watchlist and request counts per scout
  const [watchlistCounts, requestCounts] = await Promise.all([
    scoutIds.length > 0
      ? admin.from('watchlist').select('user_id').in('user_id', scoutIds)
      : Promise.resolve({ data: [] as { user_id: string }[], error: null }),
    scoutIds.length > 0
      ? admin.from('contact_requests').select('scout_id').in('scout_id', scoutIds)
      : Promise.resolve({ data: [] as { scout_id: string }[], error: null }),
  ])

  const watchlistMap = new Map<string, number>()
  for (const s of watchlistCounts.data ?? []) {
    if (s.user_id) watchlistMap.set(s.user_id, (watchlistMap.get(s.user_id) ?? 0) + 1)
  }
  const requestMap = new Map<string, number>()
  for (const r of requestCounts.data ?? []) {
    if (r.scout_id) requestMap.set(r.scout_id, (requestMap.get(r.scout_id) ?? 0) + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('platform.scouts.title')}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {pendingCount} {t('platform.scouts.pending')} · {approvedCount}{' '}
            {t('platform.scouts.approved')} · {items.length} {t('common.found')}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">{t('platform.scouts.noScouts')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.email')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.organization')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.demoRequests.country')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.registered')}</th>
                <th className="pb-3 pr-4 font-medium text-center">
                  {t('platform.scouts.watchlistCount')}
                </th>
                <th className="pb-3 pr-4 font-medium text-center">
                  {t('platform.scouts.requests')}
                </th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.status')}</th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((scout) => (
                <tr key={scout.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">
                    {scout.full_name ?? '—'}
                  </td>
                  <td className="py-3 pr-4 text-foreground-muted">{scout.email ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">{scout.organization ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">{scout.country ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">
                    {scout.created_at ? format(new Date(scout.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 pr-4 text-center text-foreground">
                    {watchlistMap.get(scout.id) ?? 0}
                  </td>
                  <td className="py-3 pr-4 text-center text-foreground">
                    {requestMap.get(scout.id) ?? 0}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        scout.is_approved
                          ? 'bg-pos-mid-bg text-pos-mid'
                          : 'bg-pos-gk-bg text-pos-gk'
                      }`}
                    >
                      {scout.is_approved
                        ? t('platform.scouts.approved')
                        : t('platform.scouts.pending')}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/platform/scouts/${scout.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        {t('common.viewAll')}
                      </Link>
                      <ApprovalButton scoutId={scout.id} isApproved={scout.is_approved ?? false} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
