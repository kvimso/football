import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'

export default async function PlatformScoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: scout, error } = await admin
    .from('profiles')
    .select('id, full_name, email, organization, phone, created_at')
    .eq('id', id)
    .eq('role', 'scout')
    .single()

  if (error || !scout) notFound()

  // Get shortlisted players and contact requests
  const [{ data: shortlists }, { data: requests }] = await Promise.all([
    admin
      .from('shortlists')
      .select(`
        id, notes, created_at,
        player:players!shortlists_player_id_fkey(id, name, name_ka, position, slug, club:clubs!players_club_id_fkey(name))
      `)
      .eq('scout_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('contact_requests')
      .select(`
        id, message, status, created_at,
        player:players!contact_requests_player_id_fkey(id, name, name_ka, slug, club:clubs!players_club_id_fkey(name))
      `)
      .eq('scout_id', id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <Link href="/platform/scouts" className="text-sm text-accent hover:underline">
        &larr; {t('admin.common.backToList')}
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-foreground">{t('platform.scouts.detail')}</h1>

      {/* Scout info */}
      <div className="mt-4 card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-foreground-muted">{t('platform.scouts.name')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{scout.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-muted">{t('platform.scouts.email')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{scout.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-muted">{t('platform.scouts.organization')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">{scout.organization ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-muted">{t('platform.scouts.registered')}</p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {scout.created_at ? format(new Date(scout.created_at), 'MMM d, yyyy') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Shortlisted players */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          {t('platform.scouts.shortlistedPlayers')} ({(shortlists ?? []).length})
        </h2>
        {(shortlists ?? []).length > 0 ? (
          <div className="mt-3 space-y-2">
            {(shortlists ?? []).map((item) => {
              const player = Array.isArray(item.player) ? item.player[0] : item.player
              const club = player?.club ? (Array.isArray(player.club) ? player.club[0] : player.club) : null
              return (
                <div key={item.id} className="card flex items-center justify-between p-3">
                  <div>
                    <Link href={`/players/${player?.slug ?? ''}`} className="text-sm font-medium text-accent hover:underline">
                      {player?.name ?? 'Unknown'}
                    </Link>
                    <p className="text-xs text-foreground-muted">
                      {player?.position} {club?.name ? `— ${club.name}` : ''}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-foreground-muted/70 italic">{item.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : ''}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('dashboard.noShortlist')}</p>
        )}
      </div>

      {/* Contact requests */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">
          {t('platform.scouts.contactRequests')} ({(requests ?? []).length})
        </h2>
        {(requests ?? []).length > 0 ? (
          <div className="mt-3 space-y-2">
            {(requests ?? []).map((req) => {
              const player = Array.isArray(req.player) ? req.player[0] : req.player
              const club = player?.club ? (Array.isArray(player.club) ? player.club[0] : player.club) : null
              return (
                <div key={req.id} className="card flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${player?.slug ?? ''}`} className="text-sm font-medium text-accent hover:underline">
                      {player?.name ?? 'Unknown'}
                    </Link>
                    {club?.name && (
                      <span className="ml-2 text-xs text-foreground-muted">({club.name})</span>
                    )}
                    <p className="mt-0.5 truncate text-xs text-foreground-muted">
                      {req.message?.slice(0, 80)}{(req.message?.length ?? 0) > 80 ? '...' : ''}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-3">
                    <span className="text-xs text-foreground-muted">
                      {req.created_at ? format(new Date(req.created_at), 'MMM d') : ''}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      req.status === 'approved'
                        ? 'bg-green-500/10 text-green-400'
                        : req.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {t(`admin.requests.${req.status}`)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('dashboard.noRequests')}</p>
        )}
      </div>
    </div>
  )
}
