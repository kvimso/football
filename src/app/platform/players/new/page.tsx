import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { PlatformPlayerForm } from '@/components/platform/PlatformPlayerForm'

export default async function PlatformNewPlayerPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: clubs } = await admin
    .from('clubs')
    .select('id, name')
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.players.addPlayer')}</h1>
      <div className="mt-6">
        <PlatformPlayerForm clubs={clubs ?? []} />
      </div>
    </div>
  )
}
