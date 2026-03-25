import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { DemoRequestsTable } from '@/components/platform/DemoRequestsTable'

export default async function PlatformDemoRequestsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: requests, error } = await admin
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 49)

  if (error) console.error('Failed to fetch demo requests:', error.message)

  const items = requests ?? []
  const newCount = items.filter((r) => r.status === 'new').length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('platform.demoRequests.title')}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {newCount} {t('platform.demoRequests.countNew')} · {items.length}{' '}
            {t('platform.demoRequests.countTotal')}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <DemoRequestsTable requests={items} />
      </div>
    </div>
  )
}
