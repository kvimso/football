import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { PlatformRequestsList } from '@/components/platform/PlatformRequestsList'

export default async function PlatformRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { t } = await getServerT()
  const admin = createAdminClient()

  let query = admin
    .from('contact_requests')
    .select(`
      id, message, status, created_at,
      scout:profiles!contact_requests_scout_id_fkey(full_name, organization, email),
      player:players!contact_requests_player_id_fkey(name, name_ka, slug, club:clubs!players_club_id_fkey(name))
    `)
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data: requests, error } = await query.limit(100)
  if (error) console.error('Failed to fetch requests:', error.message)

  const processed = (requests ?? []).map((r) => ({
    ...r,
    scout: Array.isArray(r.scout) ? r.scout[0] : r.scout,
    player: Array.isArray(r.player) ? r.player[0] : r.player,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.requests.title')}</h1>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((s) => {
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
