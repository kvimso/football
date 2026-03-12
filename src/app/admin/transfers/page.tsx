import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
import { TransferSearch } from '@/components/admin/TransferSearch'
import { TransferTabs } from '@/components/admin/TransferTabs'

export default async function AdminTransfersPage() {
  const supabase = await createClient()
  const { t, lang } = await getServerT()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    .select(
      `
      id, status, requested_at,
      player:players!transfer_requests_player_id_fkey ( name, name_ka, platform_id, position ),
      from_club:clubs!transfer_requests_from_club_id_fkey ( name, name_ka ),
      to_club:clubs!transfer_requests_to_club_id_fkey ( name, name_ka )
    `
    )
    .eq('from_club_id', clubId)
    .order('requested_at', { ascending: false })

  if (inErr) console.error('Failed to fetch incoming transfers:', inErr.message)

  // Fetch outgoing transfer requests (we want players from other clubs)
  const { data: outgoing, error: outErr } = await supabase
    .from('transfer_requests')
    .select(
      `
      id, status, requested_at,
      player:players!transfer_requests_player_id_fkey ( name, name_ka, platform_id, position ),
      from_club:clubs!transfer_requests_from_club_id_fkey ( name, name_ka ),
      to_club:clubs!transfer_requests_to_club_id_fkey ( name, name_ka )
    `
    )
    .eq('to_club_id', clubId)
    .order('requested_at', { ascending: false })

  if (outErr) console.error('Failed to fetch outgoing transfers:', outErr.message)

  // Serialize for client components
  function serializeRequests(requests: typeof incoming, direction: 'incoming' | 'outgoing') {
    return (requests ?? []).map((r) => {
      const player = unwrapRelation(r.player)
      const fromClub = unwrapRelation(r.from_club)
      const toClub = unwrapRelation(r.to_club)
      const clubName =
        direction === 'incoming'
          ? ((lang === 'ka' ? toClub?.name_ka : toClub?.name) ?? '')
          : ((lang === 'ka' ? fromClub?.name_ka : fromClub?.name) ?? '')
      return {
        id: r.id,
        status: r.status,
        requested_at: r.requested_at,
        playerName: (lang === 'ka' ? player?.name_ka : player?.name) ?? '',
        position: player?.position ?? null,
        platformId: player?.platform_id ?? null,
        clubName,
      }
    })
  }

  const incomingItems = serializeRequests(incoming, 'incoming')
  const outgoingItems = serializeRequests(outgoing, 'outgoing')
  const pendingIncoming = incomingItems.filter((r) => r.status === 'pending').length
  const pendingOutgoing = outgoingItems.filter((r) => r.status === 'pending').length
  const pendingTotal = pendingIncoming + pendingOutgoing

  return (
    <div className="space-y-5">
      {/* Compact header bar */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
          <svg
            className="h-4.5 w-4.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-foreground">{t('admin.transfers.title')}</h1>
        {pendingTotal > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-500" />
            </span>
            <span className="text-xs font-semibold text-yellow-500">{pendingTotal}</span>
          </div>
        )}
      </div>

      {/* Search section */}
      <TransferSearch />

      {/* Transfer tabs */}
      <TransferTabs
        incoming={incomingItems}
        outgoing={outgoingItems}
        pendingIncoming={pendingIncoming}
        pendingOutgoing={pendingOutgoing}
      />
    </div>
  )
}
