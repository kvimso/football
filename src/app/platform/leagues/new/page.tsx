import { getServerT } from '@/lib/server-translations'
import { LeagueForm } from '@/components/platform/LeagueForm'

export default async function NewLeaguePage() {
  const { t } = await getServerT()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.leagues.addLeague')}</h1>
      <div className="mt-6 max-w-2xl">
        <LeagueForm />
      </div>
    </div>
  )
}
