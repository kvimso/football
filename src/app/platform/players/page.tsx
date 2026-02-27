import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import type { Position } from '@/lib/types'
import { calculateAge, unwrapRelation } from '@/lib/utils'

export default async function PlatformPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ position?: string; club?: string; status?: string; q?: string }>
}) {
  const params = await searchParams
  const { t, lang } = await getServerT()
  const admin = createAdminClient()

  let query = admin
    .from('players')
    .select(`
      id, name, name_ka, position, status, platform_id, date_of_birth,
      club:clubs!players_club_id_fkey ( id, name, name_ka )
    `)
    .order('name')

  if (params.position) query = query.eq('position', params.position)
  if (params.status) query = query.eq('status', params.status as 'active' | 'free_agent')
  if (params.club) query = query.eq('club_id', params.club)
  if (params.q) {
    const sanitized = params.q.replace(/[,.()"\\%_]/g, '')
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%,platform_id.ilike.%${sanitized}%`)
    }
  }

  const [{ data: players, error }, { data: clubs }] = await Promise.all([
    query.limit(200),
    admin.from('clubs').select('id, name').order('name'),
  ])

  if (error) console.error('Failed to fetch players:', error.message)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('platform.players.title')}</h1>
        <Link href="/platform/players/new" className="btn-primary text-sm">
          {t('platform.players.addPlayer')}
        </Link>
      </div>

      {/* Filters */}
      <form className="mt-4 flex flex-wrap gap-3">
        <input
          name="q"
          type="text"
          defaultValue={params.q ?? ''}
          placeholder={t('players.search')}
          className="input w-48 text-sm"
        />
        <select name="position" defaultValue={params.position ?? ''} className="input text-sm">
          <option value="">{t('players.allPositions')}</option>
          {['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST'].map((pos) => (
            <option key={pos} value={pos}>{t(`positions.${pos}`)}</option>
          ))}
        </select>
        <select name="club" defaultValue={params.club ?? ''} className="input text-sm">
          <option value="">{t('platform.players.allClubs')}</option>
          {(clubs ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ''} className="input text-sm">
          <option value="">{t('players.allStatuses')}</option>
          <option value="active">{t('players.statusActive')}</option>
          <option value="free_agent">{t('players.statusFreeAgent')}</option>
        </select>
        <button type="submit" className="btn-primary text-sm">{t('admin.common.search')}</button>
      </form>

      {(players ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">{t('platform.players.noPlayers')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('admin.players.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.position')}</th>
                <th className="pb-3 pr-4 font-medium">{t('players.age')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.players.club')}</th>
                <th className="pb-3 pr-4 font-medium">{t('players.platformId')}</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.status')}</th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(players ?? []).map((player) => {
                const club = unwrapRelation(player.club)
                const displayName = lang === 'ka' && player.name_ka ? player.name_ka : player.name
                return (
                  <tr key={player.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">{displayName}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${POSITION_COLOR_CLASSES[player.position as Position] ?? ''}`}>
                        {player.position}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">
                      {player.date_of_birth ? calculateAge(player.date_of_birth) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">{club?.name ?? t('players.freeAgent')}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground-muted">{player.platform_id}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        player.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {t(`admin.players.${player.status}`)}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link href={`/platform/players/${player.id}/edit`} className="text-accent hover:underline">
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-foreground-muted">
            {(players ?? []).length} {t('common.found')}
          </p>
        </div>
      )}
    </div>
  )
}
