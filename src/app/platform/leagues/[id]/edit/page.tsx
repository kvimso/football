import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { LeagueForm } from '@/components/platform/LeagueForm'

export default async function EditLeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: league } = await admin.from('leagues').select('*').eq('id', id).single()

  if (!league) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.leagues.editLeague')}</h1>
      <div className="mt-6 max-w-2xl">
        <LeagueForm league={league} />
      </div>
    </div>
  )
}
