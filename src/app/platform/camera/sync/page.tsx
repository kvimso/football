import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { SyncTrigger } from '@/components/platform/SyncTrigger'
import { SyncLogTable } from '@/components/platform/SyncLogTable'

const PAGE_SIZE = 25

export default async function SyncDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const { t } = await getServerT()
  const admin = createAdminClient()

  // Validate page param
  const rawPage = parseInt(pageStr ?? '1', 10)
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : Math.min(rawPage, 10000)
  const offset = (page - 1) * PAGE_SIZE

  // Exclude errors JSONB from list query (loaded on expand only)
  const { data: logs, error } = await admin
    .from('sync_logs')
    .select(
      'id, sync_type, starlive_id, status, records_synced, records_skipped, duration_ms, triggered_by, created_at'
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE)

  if (error) console.error('Failed to fetch sync logs:', error.message)

  const allLogs = logs ?? []
  // If we got PAGE_SIZE + 1 results, there are more pages
  const hasMore = allLogs.length > PAGE_SIZE
  const displayLogs = hasMore ? allLogs.slice(0, PAGE_SIZE) : allLogs

  return (
    <div className="space-y-8">
      <SyncTrigger />

      <div>
        <h3 className="text-base font-semibold text-foreground">
          {t('platform.camera.sync.history')}
        </h3>
        <SyncLogTable logs={displayLogs} page={page} hasMore={hasMore} />
      </div>
    </div>
  )
}
