import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { unwrapRelation } from '@/lib/utils'
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
    .select(
      `
      id, status, requested_at, resolved_at, expires_at,
      player:players!transfer_requests_player_id_fkey(name, name_ka, slug, platform_id),
      from_club:clubs!transfer_requests_from_club_id_fkey(name, name_ka),
      to_club:clubs!transfer_requests_to_club_id_fkey(name, name_ka)
    `
    )
    .order('requested_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status as 'pending' | 'accepted' | 'declined' | 'expired')
  }

  const { data: transfers, error } = await query.limit(100)
  if (error) console.error('Failed to fetch transfers:', error.message)

  const processed = (transfers ?? []).map((t) => ({
    ...t,
    player: unwrapRelation(t.player),
    from_club: unwrapRelation(t.from_club),
    to_club: unwrapRelation(t.to_club),
  }))

  const statusFilters = ['all', 'pending', 'accepted', 'declined', 'expired']

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <svg
              className="h-7 w-7 text-accent"
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
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('platform.transfers.title')}</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              {processed.length} {t('admin.transfers.title').toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 rounded-xl border border-border bg-card p-1.5">
        {statusFilters.map((s) => {
          const isActive = (params.status ?? 'all') === s
          return (
            <Link
              key={s}
              href={`/platform/transfers${s === 'all' ? '' : `?status=${s}`}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent shadow-sm'
                  : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
              }`}
            >
              {t(`admin.transfers.${s === 'all' ? 'title' : s}`)}
            </Link>
          )
        })}
      </div>

      {/* Transfers list */}
      <PlatformTransfersList transfers={processed} />
    </div>
  )
}
