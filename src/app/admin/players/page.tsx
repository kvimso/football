import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { POSITION_COLOR_CLASSES } from '@/lib/constants'
import { calculateAge } from '@/lib/utils'
import { PlayerStatusActions } from '@/components/admin/PlayerStatusActions'

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const { t, lang } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (!profile?.club_id) return null

  const { data: players, error } = await supabase
    .from('players')
    .select('id, name, name_ka, position, date_of_birth, jersey_number, status, slug')
    .eq('club_id', profile.club_id)
    .order('name')

  if (error) console.error('Failed to fetch players:', error.message)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('admin.players.title')}</h1>
        <Link href="/admin/players/new" className="btn-primary text-sm">
          {t('admin.players.addPlayer')}
        </Link>
      </div>

      {players && players.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">#</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.position')}</th>
                <th className="pb-3 pr-4 font-medium">{t('players.age')}</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.status')}</th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const posClasses = POSITION_COLOR_CLASSES[player.position] ?? ''
                const displayName = lang === 'ka' ? player.name_ka : player.name
                return (
                  <tr key={player.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-foreground-muted">{player.jersey_number ?? '-'}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/players/${player.slug}`} className="font-medium text-foreground hover:text-accent">
                        {displayName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${posClasses}`}>
                        {t(`positions.${player.position}`)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">
                      {calculateAge(player.date_of_birth)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          player.status === 'active'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {t(`admin.players.${player.status}`)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/players/${player.id}/edit`}
                          className="text-xs text-accent hover:underline"
                        >
                          {t('common.edit')}
                        </Link>
                        <PlayerStatusActions playerId={player.id} status={player.status} />
                      </div>
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
