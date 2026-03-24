import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { LeagueCard } from '@/components/league/LeagueCard'

export const metadata: Metadata = {
  title: 'Leagues',
}

export default async function LeaguesPage() {
  const { t } = await getServerT()
  const supabase = await createClient()

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">{t('leagues.title')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">{t('leagues.subtitle')}</p>

      {(leagues ?? []).length === 0 ? (
        <p className="mt-8 text-sm text-foreground-muted">{t('leagues.emptyState')}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(leagues ?? []).map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      )}
    </div>
  )
}
