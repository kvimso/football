import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { PlatformTransfersList } from '@/components/platform/PlatformTransfersList'

export default async function PlatformTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const { t } = await getServerT()
  const admin = createAdminClient()

  let query = admin
    .from('transfer_requests')
    .select(`
      id, status, requested_at, resolved_at, expires_at,
      player:players!transfer_requests_player_id_fkey(name, name_ka, slug, platform_id),
      from_club:clubs!transfer_requests_from_club_id_fkey(name, name_ka),
      to_club:clubs!transfer_requests_to_club_id_fkey(name, name_ka)
    `)
    .order('requested_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status as 'pending' | 'accepted' | 'declined' | 'expired')
  }

  const { data: transfers, error } = await query.limit(100)
  if (error) console.error('Failed to fetch transfers:', error.message)

  const processed = (transfers ?? []).map((t) => ({
    ...t,
    player: Array.isArray(t.player) ? t.player[0] : t.player,
    from_club: Array.isArray(t.from_club) ? t.from_club[0] : t.from_club,
    to_club: Array.isArray(t.to_club) ? t.to_club[0] : t.to_club,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.transfers.title')}</h1>

      {/* Status filter tabs */}
      <div className="mt-4 flex gap-2">
        {['all', 'pending', 'accepted', 'declined', 'expired'].map((s) => {
          const isActive = (params.status ?? 'all') === s
          return (
            <a
              key={s}
              href={`/platform/transfers${s === 'all' ? '' : `?status=${s}`}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              {t(`admin.transfers.${s === 'all' ? 'title' : s}`)}
            </a>
          )
        })}
      </div>

      <div className="mt-6">
        <PlatformTransfersList transfers={processed} />
      </div>
    </div>
  )
}
