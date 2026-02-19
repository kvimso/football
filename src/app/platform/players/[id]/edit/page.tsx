import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { PlatformPlayerForm } from '@/components/platform/PlatformPlayerForm'

export default async function PlatformEditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const [{ data: player, error }, { data: clubs }] = await Promise.all([
    admin
      .from('players')
      .select('id, name, name_ka, date_of_birth, position, preferred_foot, height_cm, weight_kg, parent_guardian_contact, club_id, status, platform_id')
      .eq('id', id)
      .single(),
    admin.from('clubs').select('id, name').order('name'),
  ])

  if (error || !player) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t('platform.players.editPlayer')}: {player.name}
      </h1>
      {player.platform_id && (
        <p className="mt-1 font-mono text-sm text-foreground-muted">{player.platform_id}</p>
      )}
      <div className="mt-6">
        <PlatformPlayerForm player={player} clubs={clubs ?? []} />
      </div>
    </div>
  )
}
