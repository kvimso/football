import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { PlatformRequestsList } from '@/components/platform/PlatformRequestsList'

export default async function PlatformRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { t } = await getServerT()
  const admin = createAdminClient()

  // For 'expired' filter, we fetch pending and filter client-side
  const dbStatusFilter = params.status === 'expired' ? 'pending' : params.status

  let query = admin
    .from('contact_requests')
    .select(`
      id, message, status, created_at, expires_at, response_message,
      scout:profiles!contact_requests_scout_id_fkey(full_name, organization, email),
      player:players!contact_requests_player_id_fkey(name, name_ka, slug, club:clubs!players_club_id_fkey(name))
    `)
    .order('created_at', { ascending: false })

  if (dbStatusFilter && dbStatusFilter !== 'all') {
    query = query.eq('status', dbStatusFilter)
  }

  const { data: requests, error } = await query.limit(100)
  if (error) console.error('Failed to fetch requests:', error.message)

  let processed = (requests ?? []).map((r) => ({
    ...r,
    scout: unwrapRelation(r.scout),
    player: unwrapRelation(r.player),
  }))

  // Client-side filter for 'expired' tab
  if (params.status === 'expired') {
    processed = processed.filter((r) => r.expires_at && new Date(r.expires_at) < new Date())
  }
  // For 'pending' tab, exclude expired ones
  if (params.status === 'pending') {
    processed = processed.filter((r) => !r.expires_at || new Date(r.expires_at) >= new Date())
  }

  const statusFilters = ['all', 'pending', 'approved', 'rejected', 'expired']

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.requests.title')}</h1>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-2">
        {statusFilters.map((s) => {
          const isActive = (params.status ?? 'all') === s
          return (
            <a
              key={s}
              href={`/platform/requests${s === 'all' ? '' : `?status=${s}`}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t(`admin.requests.${s}`)}
            </a>
          )
        })}
      </div>

      <div className="mt-6">
        <PlatformRequestsList requests={processed} />
      </div>
    </div>
  )
}
