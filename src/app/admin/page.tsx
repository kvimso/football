import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  // Fetch club player IDs + names for downstream counts and per-player breakdown
  const { data: clubPlayers, error: cpError } = await supabase
    .from('players')
    .select('id, name, name_ka')
    .eq('club_id', clubId)
    .eq('status', 'active')

  if (cpError) console.error('Failed to fetch club players:', cpError.message)

  const playerIds = (clubPlayers ?? []).map((p) => p.id)
  const playerCount = playerIds.length

  const admin = createAdminClient()

  // Fetch counts, recent requests, and view stats in parallel
  const [requestsResult, shortlistsResult, recentRequestsResult, pageViewsResult, scoutActivityResult, viewCountsResult] =
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
      playerIds.length > 0
        ? admin
            .from('player_views')
            .select(`
              id,
              viewed_at,
              viewer:profiles!player_views_viewer_id_fkey(full_name, organization, role),
              player:players!player_views_player_id_fkey(name, name_ka)
            `)
            .in('player_id', playerIds)
            .order('viewed_at', { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null }),
      // Single RPC replaces 4 separate view count queries (10k-row fetch + 3 count queries)
      admin.rpc('get_player_view_counts'),
    ])

  if (requestsResult.error) console.error('Failed to fetch request count:', requestsResult.error.message)
  if (shortlistsResult.error) console.error('Failed to fetch shortlist count:', shortlistsResult.error.message)
  if (recentRequestsResult.error) console.error('Failed to fetch recent requests:', recentRequestsResult.error.message)
  if (pageViewsResult.error) console.error('Failed to fetch page views count:', pageViewsResult.error.message)
  if (scoutActivityResult.error) console.error('Failed to fetch scout activity:', scoutActivityResult.error.message)
  if (viewCountsResult.error) console.error('Failed to fetch view counts:', viewCountsResult.error.message)

  // Build per-player view breakdown from RPC data (replaces 10k-row fetch)
  const allViewCounts = viewCountsResult.data ?? []
  const playerNameMap = new Map((clubPlayers ?? []).map(p => [p.id, { name: p.name, name_ka: p.name_ka }]))
  const clubViewCounts = allViewCounts.filter(v => playerIds.includes(v.player_id))

  const viewsAllTime = clubViewCounts.reduce((sum, v) => sum + Number(v.total_views), 0)
  const viewsThisWeek = clubViewCounts.reduce((sum, v) => sum + Number(v.weekly_views), 0)
  const viewsLastWeek = clubViewCounts.reduce((sum, v) => sum + Number(v.prev_week_views), 0)
  const viewsTrendPercent = viewsLastWeek > 0
    ? Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100)
    : viewsThisWeek > 0 ? 100 : 0

  const perPlayerViews = clubViewCounts
    .map(v => {
      const p = playerNameMap.get(v.player_id)
      return {
        name: p?.name ?? '',
        name_ka: p?.name_ka ?? '',
        count: Number(v.total_views),
        thisWeek: Number(v.weekly_views),
        lastWeek: Number(v.prev_week_views),
      }
    })
    .filter(v => v.name)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const mostViewedPlayer = perPlayerViews[0] ?? null

  const stats: Array<{ label: string; value: number; href: string; borderColor: string; icon: string; trend?: number; subtitle?: string }> = [
    { label: t('admin.stats.totalPlayers'), value: playerCount, href: '/admin/players', borderColor: 'border-l-accent', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: t('admin.stats.pendingRequests'), value: requestsResult.count ?? 0, href: '/admin/requests', borderColor: 'border-l-yellow-500', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { label: t('admin.stats.scoutSaves'), value: shortlistsResult.count ?? 0, href: '#', borderColor: 'border-l-pos-att', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    { label: t('admin.stats.viewsThisWeek'), value: viewsThisWeek, href: '#', borderColor: 'border-l-pos-mid', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z', trend: viewsTrendPercent, subtitle: mostViewedPlayer ? `${t('admin.stats.mostViewed')}: ${mostViewedPlayer.name}` : undefined },
    { label: t('admin.stats.viewsAllTime'), value: viewsAllTime, href: '#', borderColor: 'border-l-pos-def', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6' },
  ]

  const recentRequests = ('data' in recentRequestsResult ? recentRequestsResult.data ?? [] : []).map(
    (r) => ({
      ...r,
      scout: unwrapRelation(r.scout),
      player: unwrapRelation(r.player),
    })
  ).filter((r) => r.player)

  const scoutActivity = ('data' in scoutActivityResult ? scoutActivityResult.data ?? [] : []).map(
    (v) => ({
      ...v,
      viewer: unwrapRelation(v.viewer),
      player: unwrapRelation(v.player),
    })
  ).filter((v) => v.player && v.viewer?.role === 'scout')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.nav.dashboard')}</h1>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`card border-l-4 p-4 transition-colors hover:border-l-accent ${stat.borderColor}`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
              <p className="text-xs text-foreground-muted">{stat.label}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
            {stat.trend != null && stat.trend !== 0 && (
              <p className={`mt-1 text-xs font-medium ${stat.trend > 0 ? 'text-accent' : 'text-red-400'}`}>
                {stat.trend > 0 ? '+' : ''}{stat.trend}% {t('admin.stats.viewsTrend')}
              </p>
            )}
            {stat.subtitle && (
              <p className="mt-1 truncate text-xs text-foreground-muted">{stat.subtitle}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="section-header">{t('admin.common.quickActions')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/players/new" className="btn-primary text-sm">
            {t('admin.players.addPlayer')}
          </Link>
        </div>
      </div>

      {/* Recent requests */}
      <div className="mt-8">
        <h2 className="section-header">{t('admin.common.recentRequests')}</h2>
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
                <span className={`status-badge ml-3 shrink-0 ${
                  req.status === 'approved' ? 'status-badge-approved'
                    : req.status === 'rejected' ? 'status-badge-rejected'
                    : 'status-badge-pending'
                }`}>
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

      {/* Per-player view breakdown */}
      {perPlayerViews.length > 0 && (
        <div className="mt-8">
          <h2 className="section-header">{t('admin.stats.playerViewBreakdown')}</h2>
          <div className="mt-3 space-y-2">
            {perPlayerViews.map((pv, i) => (
              <div key={i} className="card flex items-center justify-between p-3">
                <span className="text-sm font-medium text-foreground">{pv.name}</span>
                <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {pv.count} {t('players.views')}
                  {pv.thisWeek > 0 && (
                    <span className="text-xs text-foreground-muted/70">
                      ({pv.thisWeek} {t('players.thisWeek')})
                    </span>
                  )}
                  {pv.thisWeek > pv.lastWeek && (
                    <svg className="h-3 w-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  )}
                  {pv.thisWeek > 0 && pv.thisWeek < pv.lastWeek && (
                    <svg className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                    </svg>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent scout activity */}
      <div className="mt-8">
        <h2 className="section-header">{t('admin.stats.recentActivity')}</h2>
        {scoutActivity.length > 0 ? (
          <div className="mt-3 space-y-3">
            {scoutActivity.map((view) => (
              <div key={view.id} className="card flex items-center gap-3 p-4">
                <svg className="h-5 w-5 shrink-0 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">
                      {view.viewer?.full_name ?? (view.viewer?.organization ? view.viewer.organization : t('matches.unknown'))}
                    </span>
                    {view.viewer?.full_name && view.viewer?.organization && (
                      <span className="text-foreground-muted"> ({view.viewer.organization})</span>
                    )}
                    {' '}{t('admin.stats.scoutViewed')}{' '}
                    <span className="font-medium">{view.player?.name ?? ''}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted/70">
                    {view.viewed_at ? formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('admin.stats.noActivity')}</p>
        )}
      </div>
    </div>
  )
}
