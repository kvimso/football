import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import type { Position } from '@/lib/types'
import { calculateAge } from '@/lib/utils'
import { PlayerActionsMenu } from '@/components/admin/PlayerActionsMenu'
import { PlayerScoutInterest } from '@/components/admin/PlayerScoutInterest'

export default async function AdminPlayersPage() {
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

  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, name_ka, platform_id, position, date_of_birth, status, slug')
    .eq('club_id', profile.club_id)
    .order('name')

  if (error) console.error('Failed to fetch players:', error.message)

  // Fetch per-player scout demand (this week's views by country)
  const admin = createAdminClient()
  const demandMap = new Map<string, { country: string; view_count: number }[]>()
  if (players && players.length > 0) {
    const demandResults = await Promise.all(
      players.map((p) => admin.rpc('get_player_scout_demand', { p_player_id: p.id }))
    )
    players.forEach((p, i) => {
      const data = demandResults[i].data
      if (data && data.length > 0) {
        demandMap.set(p.id, data)
      }
    })
  }

  const scoutInterestLabels = {
    scoutInterest: t('admin.stats.scoutInterest'),
    noInterest: t('admin.stats.noScoutViews'),
    views: t('admin.stats.views'),
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('admin.players.title')}</h1>
        <Link href="/admin/players/new" className="btn-primary text-sm">
          {t('admin.players.addPlayer')}
        </Link>
      </div>

      {players && players.length > 0 ? (
        <div className="mt-6 card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                <th className="hidden px-4 py-3 sm:table-cell">{t('players.platformId')}</th>
                <th className="px-4 py-3">{t('admin.players.name')}</th>
                <th className="px-4 py-3">{t('admin.players.position')}</th>
                <th className="hidden px-4 py-3 sm:table-cell">{t('players.age')}</th>
                <th className="px-4 py-3">{t('admin.players.status')}</th>
                <th className="hidden px-4 py-3 sm:table-cell">{t('admin.stats.scoutInterest')}</th>
                <th className="px-4 py-3 text-center">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const posClasses = POSITION_COLOR_CLASSES[player.position as Position] ?? ''
                const displayName = lang === 'ka' ? player.name_ka : player.name
                return (
                  <tr key={player.id} className="table-row-hover border-b border-border/50">
                    <td className="hidden px-4 py-3 font-mono text-xs text-foreground-muted sm:table-cell">
                      {player.platform_id ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/players/${player.slug}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${posClasses}`}
                      >
                        {t(`positions.${player.position}`)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-foreground-muted sm:table-cell">
                      {calculateAge(player.date_of_birth)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`status-badge ${
                          player.status === 'active'
                            ? 'status-badge-approved'
                            : 'status-badge-pending'
                        }`}
                      >
                        {t(`admin.players.${player.status}`)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <PlayerScoutInterest
                        playerName={displayName}
                        demand={demandMap.get(player.id) ?? []}
                        labels={scoutInterestLabels}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <PlayerActionsMenu
                        playerId={player.id}
                        playerName={displayName}
                        isActive={player.status === 'active'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-foreground-muted">{t('admin.players.noPlayers')}</p>
      )}
    </div>
  )
}
