import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { ToggleActiveButton } from './ToggleActiveButton'
import { DeleteLeagueButton } from './DeleteLeagueButton'

export default async function PlatformLeaguesPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: leagues, error } = await admin
    .from('leagues')
    .select('*')
    .order('display_order')
    .order('created_at')

  if (error) console.error('Failed to fetch leagues:', error.message)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('platform.leagues.title')}</h1>
        <Link href="/platform/leagues/new" className="btn-primary text-sm">
          {t('platform.leagues.addLeague')}
        </Link>
      </div>

      {(leagues ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">{t('platform.leagues.noLeagues')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.leagues.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.leagues.ageGroup')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.leagues.season')}</th>
                <th className="pb-3 pr-4 font-medium text-center">
                  {t('platform.leagues.active')}
                </th>
                <th className="pb-3 pr-4 font-medium text-center">
                  {t('platform.leagues.displayOrder')}
                </th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(leagues ?? []).map((league) => (
                <tr key={league.id} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{league.name}</p>
                    <p className="text-xs text-foreground-muted">{league.name_ka}</p>
                  </td>
                  <td className="py-3 pr-4 text-foreground-muted">{league.age_group}</td>
                  <td className="py-3 pr-4 text-foreground-muted">{league.season}</td>
                  <td className="py-3 pr-4 text-center">
                    <ToggleActiveButton leagueId={league.id} isActive={league.is_active} />
                  </td>
                  <td className="py-3 pr-4 text-center text-foreground">{league.display_order}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/platform/leagues/${league.id}/edit`}
                        className="text-primary hover:underline"
                      >
                        {t('common.edit')}
                      </Link>
                      <DeleteLeagueButton leagueId={league.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
