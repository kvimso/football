import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

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

  // Fetch club info for welcome header
  const { data: club } = await supabase
    .from('clubs')
    .select('name, name_ka, logo_url')
    .eq('id', clubId)
    .single()

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
  const [requestsResult, shortlistsResult, recentRequestsResult, pageViewsResult, scoutActivityResult, viewCountsResult, unreadResult] =
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
      admin.rpc('get_player_view_counts', { player_ids: playerIds }),
      supabase.rpc('get_total_unread_count'),
    ])

  if (requestsResult.error) console.error('Failed to fetch request count:', requestsResult.error.message)
  if (shortlistsResult.error) console.error('Failed to fetch shortlist count:', shortlistsResult.error.message)
  if (recentRequestsResult.error) console.error('Failed to fetch recent requests:', recentRequestsResult.error.message)
  if (pageViewsResult.error) console.error('Failed to fetch page views count:', pageViewsResult.error.message)
  if (scoutActivityResult.error) console.error('Failed to fetch scout activity:', scoutActivityResult.error.message)
  if (viewCountsResult.error) console.error('Failed to fetch view counts:', viewCountsResult.error.message)
  if (unreadResult.error) console.error('Failed to fetch unread count:', unreadResult.error.message)

  // Build per-player view breakdown from RPC data
  const clubViewCounts = viewCountsResult.data ?? []
  const playerNameMap = new Map((clubPlayers ?? []).map(p => [p.id, { name: p.name, name_ka: p.name_ka }]))

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

  const unreadCount = Number(unreadResult.data ?? 0)

  const stats: Array<{ label: string; value: number; href: string; icon: string; trend?: number; subtitle?: string }> = [
    { label: t('admin.stats.totalPlayers'), value: playerCount, href: '/admin/players', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: t('admin.stats.unreadMessages'), value: unreadCount, href: '/admin/messages', icon: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z' },
    { label: t('admin.stats.scoutSaves'), value: shortlistsResult.count ?? 0, href: '#', icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    { label: t('admin.stats.viewsThisWeek'), value: viewsThisWeek, href: '#', icon: 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z', trend: viewsTrendPercent, subtitle: mostViewedPlayer ? `${t('admin.stats.mostViewed')}: ${mostViewedPlayer.name}` : undefined },
    { label: t('admin.stats.viewsAllTime'), value: viewsAllTime, href: '#', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6' },
  ]

  const scoutActivity = ('data' in scoutActivityResult ? scoutActivityResult.data ?? [] : []).map(
    (v) => ({
      ...v,
      viewer: unwrapRelation(v.viewer),
      player: unwrapRelation(v.player),
    })
  ).filter((v) => v.player && v.viewer?.role === 'scout')

  const clubName = club?.name ?? ''

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{clubName}</h1>
            <p className="text-sm text-foreground-muted">{t('admin.nav.dashboard')}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-accent/30 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{stat.label}</p>
            {stat.trend != null && stat.trend !== 0 && (
              <p className={`mt-1 text-xs font-medium ${stat.trend > 0 ? 'text-accent' : 'text-red-400'}`}>
                {stat.trend > 0 ? '+' : ''}{stat.trend}% {t('admin.stats.viewsTrend')}
              </p>
            )}
            {stat.subtitle && (
              <p className="mt-1 truncate text-[11px] text-foreground-muted/70">{stat.subtitle}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Two-column layout for sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quick Actions card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{t('admin.common.quickActions')}</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/admin/players/new" className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary">
              <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              {t('admin.players.addPlayer')}
            </Link>
            <Link href="/admin/messages" className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary">
              <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              {t('chat.messages')}
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/admin/players" className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary">
              <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('admin.nav.players')}
            </Link>
            <Link href="/admin/transfers" className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-all hover:border-accent/30 hover:bg-background-secondary">
              <svg className="h-4.5 w-4.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              {t('admin.nav.transfers')}
            </Link>
          </div>
        </div>

        {/* Player Views card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{t('admin.stats.playerViewBreakdown')}</h2>
          {perPlayerViews.length > 0 ? (
            <div className="mt-4 space-y-2">
              {perPlayerViews.map((pv, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5">
                  <span className="text-sm font-medium text-foreground">{pv.name}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {pv.count}
                    {pv.thisWeek > 0 && (
                      <span className="text-xs text-foreground-muted/70">
                        (+{pv.thisWeek})
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
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-8 text-center">
              <svg className="h-10 w-10 text-foreground-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="mt-2 text-sm text-foreground-muted">{t('admin.stats.noActivity')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scout Activity — full width */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{t('admin.stats.recentActivity')}</h2>
        {scoutActivity.length > 0 ? (
          <div className="mt-4 space-y-2">
            {scoutActivity.map((view) => (
              <div key={view.id} className="flex items-center gap-3 rounded-lg bg-background px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
                  <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
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
                </div>
                <span className="shrink-0 text-xs text-foreground-muted/70">
                  {view.viewed_at ? formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true }) : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-background py-10 text-center">
            <svg className="h-12 w-12 text-foreground-muted/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-foreground-muted">{t('admin.stats.noActivity')}</p>
            <p className="mt-1 text-xs text-foreground-muted/60">{t('admin.stats.noActivity')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
