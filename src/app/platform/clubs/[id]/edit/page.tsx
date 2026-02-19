import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { ClubForm } from '@/components/platform/ClubForm'

export default async function PlatformEditClubPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: club, error } = await admin
    .from('clubs')
    .select('id, name, name_ka, slug, city, region, description, description_ka, website')
    .eq('id', id)
    .single()

  if (error || !club) notFound()

  // Get squad for this club
  const { data: players } = await admin
    .from('players')
    .select('id, name, name_ka, position, status, platform_id, date_of_birth')
    .eq('club_id', id)
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.clubs.editClub')}: {club.name}</h1>

      <div className="mt-6 card p-6">
        <ClubForm club={club} />
      </div>

      {/* Squad */}
      {(players ?? []).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">{t('clubs.squad')} ({players?.length})</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground-muted">
                  <th className="pb-3 pr-4 font-medium">{t('admin.players.name')}</th>
                  <th className="pb-3 pr-4 font-medium">{t('admin.players.position')}</th>
                  <th className="pb-3 pr-4 font-medium">{t('players.platformId')}</th>
                  <th className="pb-3 pr-4 font-medium">{t('admin.players.status')}</th>
                  <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(players ?? []).map((player) => (
                  <tr key={player.id} className="border-b border-border/50">
                    <td className="py-3 pr-4 font-medium text-foreground">{player.name}</td>
                    <td className="py-3 pr-4 text-foreground-muted">{player.position}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground-muted">{player.platform_id}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        player.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/platform/players/${player.id}/edit`}
                        className="text-accent hover:underline"
                      >
                        {t('common.edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
