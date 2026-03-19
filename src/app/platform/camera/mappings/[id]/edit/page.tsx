import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { PlayerMappingForm } from '@/components/platform/PlayerMappingForm'

export default async function EditPlayerMappingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: mapping, error } = await admin
    .from('starlive_player_map')
    .select('*, players(id, name, name_ka, club_id, clubs(name, name_ka))')
    .eq('id', id)
    .single()

  if (error || !mapping) notFound()

  const player = Array.isArray(mapping.players) ? mapping.players[0] : mapping.players
  const club = player?.clubs ? (Array.isArray(player.clubs) ? player.clubs[0] : player.clubs) : null

  return (
    <div>
      <Link
        href="/platform/camera/mappings"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        ← {t('platform.camera.mappings.title')}
      </Link>
      <h2 className="mt-3 text-lg font-semibold text-foreground">
        {t('platform.camera.mappings.editMapping')}
      </h2>
      <div className="mt-6 card p-6">
        <PlayerMappingForm
          mapping={{
            id: mapping.id,
            starlive_player_id: mapping.starlive_player_id,
            player_id: mapping.player_id,
            starlive_team_id: mapping.starlive_team_id,
            club_id: mapping.club_id,
            jersey_number: mapping.jersey_number,
          }}
          initialPlayerName={player?.name ?? ''}
          initialClubName={club?.name ?? ''}
        />
      </div>
    </div>
  )
}
