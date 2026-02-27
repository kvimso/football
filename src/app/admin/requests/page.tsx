import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { format } from 'date-fns'
import { RequestActions } from '@/components/admin/RequestActions'

interface AdminRequestsPageProps {
  searchParams: Promise<{ status?: string }>
}

function getDaysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function isRequestExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const { t, lang } = await getServerT()

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

  // First get this club's player IDs for filtering
  const { data: clubPlayers } = await supabase
    .from('players')
    .select('id')
    .eq('club_id', profile.club_id)

  const playerIds = (clubPlayers ?? []).map((p) => p.id)

  if (playerIds.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.requests.title')}</h1>
        <p className="mt-6 text-sm text-foreground-muted">{t('admin.requests.noRequests')}</p>
      </div>
    )
  }

  // For 'expired' filter, we fetch pending and filter client-side
  const dbStatusFilter = params.status === 'expired' ? 'pending' : params.status

  let query = supabase
    .from('contact_requests')
    .select(`
      id,
      message,
      status,
      created_at,
      responded_at,
      expires_at,
      response_message,
      scout:profiles!contact_requests_scout_id_fkey(full_name, organization, email),
      player:players!contact_requests_player_id_fkey(name, name_ka, club_id, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  query = query.in('player_id', playerIds)

  if (dbStatusFilter && dbStatusFilter !== 'all') {
    query = query.eq('status', dbStatusFilter)
  }

  const { data: requests, error } = await query

  if (error) console.error('Failed to fetch requests:', error.message)

  let clubRequests = (requests ?? []).map((r) => ({
    ...r,
    player: unwrapRelation(r.player),
    scout: unwrapRelation(r.scout),
  })).filter((r) => r.player)

  // Client-side filter for 'expired' tab
  if (params.status === 'expired') {
    clubRequests = clubRequests.filter((r) => isRequestExpired(r.expires_at))
  }
  // For 'pending' tab, exclude expired ones
  if (params.status === 'pending') {
    clubRequests = clubRequests.filter((r) => !isRequestExpired(r.expires_at))
  }

  const statusFilters = ['all', 'pending', 'approved', 'rejected', 'expired']

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.requests.title')}</h1>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-2">
        {statusFilters.map((s) => {
          const isActive = (params.status ?? 'all') === s
          return (
            <a
              key={s}
              href={`/admin/requests${s === 'all' ? '' : `?status=${s}`}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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

      {clubRequests.length > 0 ? (
        <div className="mt-6 space-y-3">
          {clubRequests.map((req) => {
            const playerName = lang === 'ka' ? req.player?.name_ka : req.player?.name
            const expired = req.status === 'pending' && isRequestExpired(req.expires_at)
            const daysUntilExpiry = req.expires_at ? getDaysUntil(req.expires_at) : null
            const daysSent = req.created_at ? getDaysSince(req.created_at) : 0

            return (
              <div key={req.id} className={`card border-l-4 border-l-transparent p-4 hover:border-l-accent ${expired ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {req.scout?.full_name ?? t('matches.unknown')}
                      </span>
                      {req.scout?.organization && (
                        <span className="text-xs text-foreground-muted">({req.scout.organization})</span>
                      )}
                      <span className="text-xs text-foreground-muted">&rarr;</span>
                      <a
                        href={`/players/${req.player?.slug}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        {playerName ?? ''}
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-foreground-muted">{req.message}</p>

                    {/* Urgency / timing info for pending requests */}
                    {req.status === 'pending' && (
                      <div className="mt-2 flex items-center gap-2">
                        {expired ? (
                          <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-medium text-gray-400">
                            {t('admin.requests.expired')}
                          </span>
                        ) : daysUntilExpiry !== null && daysUntilExpiry <= 1 ? (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                            {t('admin.requests.expiresTomorrow')}
                          </span>
                        ) : daysUntilExpiry !== null && daysUntilExpiry <= 7 ? (
                          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                            {t('admin.requests.expiringSoon').replace('{days}', String(daysUntilExpiry))}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-muted/70">
                            {t('admin.requests.sentDaysAgo').replace('{days}', String(daysSent))}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Response message display for already-responded requests */}
                    {req.response_message && req.status !== 'pending' && (
                      <div className="mt-2 rounded-lg bg-surface-alt/50 p-2">
                        <p className="text-xs text-foreground-muted">{req.response_message}</p>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-foreground-muted/70">
                      {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy \'at\' HH:mm') : ''}
                      {req.responded_at && (
                        <> &middot; {t('dashboard.responded')}: {format(new Date(req.responded_at), 'MMM d, yyyy')}</>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    {req.status === 'pending' && !expired ? (
                      <RequestActions requestId={req.id} />
                    ) : req.status === 'pending' && expired ? (
                      <span className="rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                        {t('admin.requests.expired')}
                      </span>
                    ) : (
                      <span className={`status-badge ${
                        req.status === 'approved' ? 'status-badge-approved' : 'status-badge-rejected'
                      }`}>
                        {t(`admin.requests.${req.status}`)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-6 text-sm text-foreground-muted">{t('admin.requests.noRequests')}</p>
      )}
    </div>
  )
}
