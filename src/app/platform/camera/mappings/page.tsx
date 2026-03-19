import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { DeletePlayerMappingButton } from '@/components/platform/PlayerMappingForm'

export default async function CameraPlayerMappingsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: mappings, error } = await admin
    .from('starlive_player_map')
    .select('*, players(id, name, name_ka, slug, position, club_id), clubs(id, name)')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to fetch player mappings:', error.message)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('platform.camera.mappings.title')}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {t('platform.camera.mappings.description')}
          </p>
        </div>
        <Link href="/platform/camera/mappings/new" className="btn-primary text-sm">
          {t('platform.camera.mappings.addMapping')}
        </Link>
      </div>

      {(mappings ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">
          {t('platform.camera.mappings.noMappings')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.camera.mappings.player')}</th>
                <th className="pb-3 pr-4 font-medium">{t('admin.players.position')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.camera.mappings.club')}</th>
                <th className="pb-3 pr-4 font-medium">
                  {t('platform.camera.mappings.starliveId')}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t('platform.camera.mappings.jerseyNumber')}
                </th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(mappings ?? []).map((m) => {
                const player = Array.isArray(m.players) ? m.players[0] : m.players
                const club = Array.isArray(m.clubs) ? m.clubs[0] : m.clubs
                return (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{player?.name ?? '—'}</p>
                      <p className="text-xs text-foreground-muted">{player?.name_ka ?? ''}</p>
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">{player?.position ?? '—'}</td>
                    <td className="py-3 pr-4 text-foreground-muted">{club?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-foreground">{m.starlive_player_id}</td>
                    <td className="py-3 pr-4 text-foreground-muted">{m.jersey_number ?? '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/platform/camera/mappings/${m.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          {t('common.edit')}
                        </Link>
                        <DeletePlayerMappingButton mappingId={m.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
