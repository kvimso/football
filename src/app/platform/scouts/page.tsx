import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'

export default async function PlatformScoutsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: scouts, error } = await admin
    .from('profiles')
    .select('id, full_name, email, organization, created_at')
    .eq('role', 'scout')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to fetch scouts:', error.message)

  const scoutIds = (scouts ?? []).map((s) => s.id)

  // Get shortlist and request counts per scout
  const [shortlistCounts, requestCounts] = await Promise.all([
    scoutIds.length > 0
      ? admin.from('shortlists').select('scout_id').in('scout_id', scoutIds)
      : Promise.resolve({ data: [] as { scout_id: string }[], error: null }),
    scoutIds.length > 0
      ? admin.from('contact_requests').select('scout_id').in('scout_id', scoutIds)
      : Promise.resolve({ data: [] as { scout_id: string }[], error: null }),
  ])

  const shortlistMap = new Map<string, number>()
  for (const s of shortlistCounts.data ?? []) {
    if (s.scout_id) shortlistMap.set(s.scout_id, (shortlistMap.get(s.scout_id) ?? 0) + 1)
  }
  const requestMap = new Map<string, number>()
  for (const r of requestCounts.data ?? []) {
    if (r.scout_id) requestMap.set(r.scout_id, (requestMap.get(r.scout_id) ?? 0) + 1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.scouts.title')}</h1>

      {(scouts ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">{t('platform.scouts.noScouts')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.email')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.organization')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.scouts.registered')}</th>
                <th className="pb-3 pr-4 font-medium text-center">{t('platform.scouts.shortlists')}</th>
                <th className="pb-3 pr-4 font-medium text-center">{t('platform.scouts.requests')}</th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(scouts ?? []).map((scout) => (
                <tr key={scout.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium text-foreground">{scout.full_name ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">{scout.email ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">{scout.organization ?? '—'}</td>
                  <td className="py-3 pr-4 text-foreground-muted">
                    {scout.created_at ? format(new Date(scout.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 pr-4 text-center text-foreground">{shortlistMap.get(scout.id) ?? 0}</td>
                  <td className="py-3 pr-4 text-center text-foreground">{requestMap.get(scout.id) ?? 0}</td>
                  <td className="py-3">
                    <Link href={`/platform/scouts/${scout.id}`} className="text-accent hover:underline">
                      {t('common.viewAll')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-foreground-muted">
            {(scouts ?? []).length} {t('common.found')}
          </p>
        </div>
      )}
    </div>
  )
}
