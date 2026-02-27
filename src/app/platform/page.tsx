import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { format } from 'date-fns'

export default async function PlatformDashboardPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const [
    playersResult,
    clubsResult,
    scoutsResult,
    matchesResult,
    pendingRequestsResult,
    pendingTransfersResult,
    freeAgentsResult,
  ] = await Promise.all([
    admin.from('players').select('id', { count: 'exact', head: true }),
    admin.from('clubs').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'scout'),
    admin.from('matches').select('id', { count: 'exact', head: true }),
    admin.from('contact_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('transfer_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('players').select('id', { count: 'exact', head: true }).eq('status', 'free_agent'),
  ])

  const stats = [
    { label: t('platform.stats.totalPlayers'), value: playersResult.count ?? 0, href: '/platform/players' },
    { label: t('platform.stats.totalClubs'), value: clubsResult.count ?? 0, href: '/platform/clubs' },
    { label: t('platform.stats.totalScouts'), value: scoutsResult.count ?? 0, href: '/platform/scouts' },
    { label: t('platform.stats.totalMatches'), value: matchesResult.count ?? 0, href: '#' },
    { label: t('platform.stats.pendingRequests'), value: pendingRequestsResult.count ?? 0, href: '/platform/requests' },
    { label: t('platform.stats.pendingTransfers'), value: pendingTransfersResult.count ?? 0, href: '/platform/transfers' },
    { label: t('platform.stats.freeAgents'), value: freeAgentsResult.count ?? 0, href: '/platform/players?status=free_agent' },
  ]

  // Club breakdown
  const { data: clubs } = await admin
    .from('clubs')
    .select('id, name, name_ka, city')
    .order('name')

  const clubIds = (clubs ?? []).map((c) => c.id)

  // Get player counts per club and admin counts per club
  const [playersByClub, adminsByClub] = await Promise.all([
    clubIds.length > 0
      ? admin
          .from('players')
          .select('club_id')
          .in('club_id', clubIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [] as { club_id: string }[], error: null }),
    clubIds.length > 0
      ? admin
          .from('profiles')
          .select('club_id')
          .in('club_id', clubIds)
          .eq('role', 'academy_admin')
      : Promise.resolve({ data: [] as { club_id: string }[], error: null }),
  ])

  const playerCountMap = new Map<string, number>()
  for (const p of playersByClub.data ?? []) {
    if (p.club_id) playerCountMap.set(p.club_id, (playerCountMap.get(p.club_id) ?? 0) + 1)
  }
  const adminCountMap = new Map<string, number>()
  for (const a of adminsByClub.data ?? []) {
    if (a.club_id) adminCountMap.set(a.club_id, (adminCountMap.get(a.club_id) ?? 0) + 1)
  }

  // Recent activity (last 10 contact requests)
  const { data: recentRequests } = await admin
    .from('contact_requests')
    .select(`
      id, status, created_at, message,
      scout:profiles!contact_requests_scout_id_fkey(full_name, organization),
      player:players!contact_requests_player_id_fkey(name, name_ka, club:clubs!players_club_id_fkey(name))
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const activity = (recentRequests ?? []).map((r) => ({
    ...r,
    scout: unwrapRelation(r.scout),
    player: unwrapRelation(r.player),
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.dashboard.title')}</h1>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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

      {/* Club breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('platform.dashboard.clubBreakdown')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(clubs ?? []).map((club) => (
            <Link
              key={club.id}
              href={`/platform/clubs/${club.id}/edit`}
              className="card flex items-center justify-between p-4 transition-colors hover:border-accent/30"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{club.name}</p>
                {club.city && (
                  <p className="text-xs text-foreground-muted">{club.city}</p>
                )}
              </div>
              <div className="flex gap-4 text-right">
                <div>
                  <p className="text-lg font-bold text-foreground">{playerCountMap.get(club.id) ?? 0}</p>
                  <p className="text-xs text-foreground-muted">{t('platform.dashboard.players')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{adminCountMap.get(club.id) ?? 0}</p>
                  <p className="text-xs text-foreground-muted">{t('platform.dashboard.admins')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">{t('platform.dashboard.recentActivity')}</h2>
        {activity.length > 0 ? (
          <div className="mt-3 space-y-3">
            {activity.map((req) => {
              const club = req.player?.club
                ? unwrapRelation(req.player.club)
                : null
              return (
                <div key={req.id} className="card flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {req.scout?.full_name ?? 'Unknown'} &rarr; {req.player?.name ?? ''}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {club?.name ? `${club.name} ` : ''}
                      {req.message ? `— ${req.message.slice(0, 60)}${req.message.length > 60 ? '...' : ''}` : ''}
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
              )
            })}
            <Link href="/platform/requests" className="text-sm text-accent hover:underline">
              {t('common.viewAll')} &rarr;
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('platform.requests.noRequests')}</p>
        )}
      </div>
    </div>
  )
}
