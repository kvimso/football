import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { format } from 'date-fns'
import { TransferSearch } from '@/components/admin/TransferSearch'
import { TransferActions } from '@/components/admin/TransferActions'

export default async function AdminTransfersPage() {
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

  const clubId = profile.club_id

  // Fetch incoming transfer requests (other clubs want our players)
  const { data: incoming, error: inErr } = await supabase
    .from('transfer_requests')
    .select(`
      id, status, requested_at,
      player:players!transfer_requests_player_id_fkey ( name, name_ka, platform_id, position ),
      from_club:clubs!transfer_requests_from_club_id_fkey ( name, name_ka ),
      to_club:clubs!transfer_requests_to_club_id_fkey ( name, name_ka )
    `)
    .eq('from_club_id', clubId)
    .order('requested_at', { ascending: false })

  if (inErr) console.error('Failed to fetch incoming transfers:', inErr.message)

  // Fetch outgoing transfer requests (we want players from other clubs)
  const { data: outgoing, error: outErr } = await supabase
    .from('transfer_requests')
    .select(`
      id, status, requested_at,
      player:players!transfer_requests_player_id_fkey ( name, name_ka, platform_id, position ),
      from_club:clubs!transfer_requests_from_club_id_fkey ( name, name_ka ),
      to_club:clubs!transfer_requests_to_club_id_fkey ( name, name_ka )
    `)
    .eq('to_club_id', clubId)
    .order('requested_at', { ascending: false })

  if (outErr) console.error('Failed to fetch outgoing transfers:', outErr.message)

  const incomingRequests = (incoming ?? []).map((r) => ({
    ...r,
    player: Array.isArray(r.player) ? r.player[0] : r.player,
    from_club: Array.isArray(r.from_club) ? r.from_club[0] : r.from_club,
    to_club: Array.isArray(r.to_club) ? r.to_club[0] : r.to_club,
  }))

  const outgoingRequests = (outgoing ?? []).map((r) => ({
    ...r,
    player: Array.isArray(r.player) ? r.player[0] : r.player,
    from_club: Array.isArray(r.from_club) ? r.from_club[0] : r.from_club,
    to_club: Array.isArray(r.to_club) ? r.to_club[0] : r.to_club,
  }))

  function statusClasses(status: string) {
    switch (status) {
      case 'accepted': return 'status-badge-approved'
      case 'declined': return 'status-badge-rejected'
      case 'expired': return 'status-badge-rejected'
      default: return 'status-badge-pending'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.transfers.title')}</h1>

      {/* Transfer search */}
      <div className="mt-6">
        <TransferSearch />
      </div>

      {/* Incoming transfer requests */}
      <div className="mt-8">
        <h2 className="section-header">{t('admin.transfers.incoming')}</h2>
        {incomingRequests.length > 0 ? (
          <div className="mt-3 space-y-2">
            {incomingRequests.map((req) => {
              const playerName = lang === 'ka' ? req.player?.name_ka : req.player?.name
              const toClubName = lang === 'ka' ? req.to_club?.name_ka : req.to_club?.name
              return (
                <div key={req.id} className="card border-l-4 border-l-transparent flex items-center justify-between p-4 hover:border-l-accent">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{playerName}</span>
                      {req.player?.platform_id && (
                        <span className="font-mono text-xs text-foreground-muted">{req.player.platform_id}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                      <span>{t('admin.transfers.to')}: {toClubName}</span>
                      <span>&middot;</span>
                      <span>{format(new Date(req.requested_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    {req.status === 'pending' ? (
                      <TransferActions requestId={req.id} />
                    ) : (
                      <span className={`status-badge ${statusClasses(req.status)}`}>
                        {t(`admin.transfers.${req.status}`)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('admin.transfers.noIncoming')}</p>
        )}
      </div>

      {/* Outgoing transfer requests */}
      <div className="mt-8">
        <h2 className="section-header">{t('admin.transfers.outgoing')}</h2>
        {outgoingRequests.length > 0 ? (
          <div className="mt-3 space-y-2">
            {outgoingRequests.map((req) => {
              const playerName = lang === 'ka' ? req.player?.name_ka : req.player?.name
              const fromClubName = lang === 'ka' ? req.from_club?.name_ka : req.from_club?.name
              return (
                <div key={req.id} className="card border-l-4 border-l-transparent flex items-center justify-between p-4 hover:border-l-accent">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{playerName}</span>
                      {req.player?.platform_id && (
                        <span className="font-mono text-xs text-foreground-muted">{req.player.platform_id}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                      <span>{t('admin.transfers.from')}: {fromClubName}</span>
                      <span>&middot;</span>
                      <span>{format(new Date(req.requested_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <span className={`status-badge ml-3 shrink-0 ${statusClasses(req.status)}`}>
                    {t(`admin.transfers.${req.status}`)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-foreground-muted">{t('admin.transfers.noOutgoing')}</p>
        )}
      </div>
    </div>
  )
}
