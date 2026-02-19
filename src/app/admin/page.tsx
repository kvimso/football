import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to fetch profile:', profileError.message)
  if (!profile?.club_id) {
    return (
      <div className="p-8 text-center text-foreground-muted">
        <p>{t('admin.noClub')}</p>
      </div>
    )
  }

  const clubId = profile.club_id

  // Fetch club player IDs first, then use for downstream counts
  const { data: clubPlayers, error: cpError } = await supabase
    .from('players')
    .select('id')
    .eq('club_id', clubId)
    .eq('status', 'active')

  if (cpError) console.error('Failed to fetch club players:', cpError.message)

  const playerIds = (clubPlayers ?? []).map((p) => p.id)
  const playerCount = playerIds.length

  // Fetch counts and recent requests in parallel using player IDs
  const admin = createAdminClient()
  const [requestsResult, shortlistsResult, recentRequestsResult, pageViewsResult] =
    await Promise.all([
      playerIds.length > 0
        ? supabase
            .from('contact_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .in('player_id', playerIds)
        : Promise.resolve({ count: 0, error: null }),
      playerIds.length > 0
        ? supabase
            .from('shortlists')
            .select('id', { count: 'exact', head: true })
            .in('player_id', playerIds)
        : Promise.resolve({ count: 0, error: null }),
      playerIds.length > 0
        ? supabase
            .from('contact_requests')
            .select(`
              id,
              message,
              status,
              created_at,
              scout:profiles!contact_requests_scout_id_fkey(full_name, organization),
              player:players!contact_requests_player_id_fkey(name, name_ka)
            `)
            .in('player_id', playerIds)
            .order('created_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      playerIds.length > 0
        ? admin
            .from('page_views')
            .select('id', { count: 'exact', head: true })
            .eq('page_type', 'player')
            .in('entity_id', playerIds)
        : Promise.resolve({ count: 0, error: null }),
    ])

  if (requestsResult.error) console.error('Failed to fetch request count:', requestsResult.error.message)
  if (shortlistsResult.error) console.error('Failed to fetch shortlist count:', shortlistsResult.error.message)
  if (recentRequestsResult.error) console.error('Failed to fetch recent requests:', recentRequestsResult.error.message)
  if (pageViewsResult.error) console.error('Failed to fetch page views count:', pageViewsResult.error.message)

  const stats = [
    { label: t('admin.stats.totalPlayers'), value: playerCount, href: '/admin/players' },
    { label: t('admin.stats.pendingRequests'), value: requestsResult.count ?? 0, href: '/admin/requests' },
    { label: t('admin.stats.scoutSaves'), value: shortlistsResult.count ?? 0, href: '#' },
    { label: t('admin.stats.playerViews'), value: pageViewsResult.count ?? 0, href: '#' },
  ]

  const recentRequests = ('data' in recentRequestsResult ? recentRequestsResult.data ?? [] : []).map(
    (r) => ({
      ...r,
      scout: Array.isArray(r.scout) ? r.scout[0] : r.scout,
      player: Array.isArray(r.player) ? r.player[0] : r.player,
    })
  ).filter((r) => r.player)

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.nav.dashboard')}</h1>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-4 transition-colors hover:border-accent/30"
          >
            <p className="text-sm text-foreground-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.common.quickActions')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/players/new" className="btn-primary text-sm">
            {t('admin.players.addPlayer')}
          </Link>
        </div>
      </div>

      {/* Recent requests */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('admin.common.recentRequests')}</h2>
        {recentRequests.length > 0 ? (
          <div className="mt-3 space-y-3">
            {recentRequests.map((req) => (
              <div key={req.id} className="card flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {req.scout?.full_name ?? t('matches.unknown')} &rarr; {req.player?.name ?? ''}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-foreground-muted">
                    {req.message.slice(0, 80)}{req.message.length > 80 ? '...' : ''}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted/70">
                    {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    req.status === 'approved'
                      ? 'bg-green-500/10 text-green-400'
                      : req.status === 'rejected'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  {t(`admin.requests.${req.status}`)}
                </span>
              </div>
            ))}
            <Link href="/admin/requests" className="text-sm text-accent hover:underline">
              {t('common.viewAll')} &rarr;
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('admin.requests.noRequests')}</p>
        )}
      </div>
    </div>
  )
}
