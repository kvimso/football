import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { DeleteClubMappingButton } from '@/components/platform/ClubMappingForm'

export default async function CameraClubMappingsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: mappings, error } = await admin
    .from('starlive_club_map')
    .select('*, clubs(id, name, name_ka)')
    .order('created_at', { ascending: false })

  if (error) console.error('Failed to fetch club mappings:', error.message)

  // Count player mappings per club for delete confirmation
  const clubIds = (mappings ?? []).map((m) => m.club_id).filter(Boolean)
  const playerMapCounts = new Map<string, number>()
  if (clubIds.length > 0) {
    const { data: playerMaps } = await admin
      .from('starlive_player_map')
      .select('club_id')
      .in('club_id', clubIds)
    for (const pm of playerMaps ?? []) {
      if (pm.club_id) playerMapCounts.set(pm.club_id, (playerMapCounts.get(pm.club_id) ?? 0) + 1)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('platform.camera.clubs.title')}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {t('platform.camera.clubs.description')}
          </p>
        </div>
        <Link href="/platform/camera/clubs/new" className="btn-primary text-sm">
          {t('platform.camera.clubs.addMapping')}
        </Link>
      </div>

      {(mappings ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">
          {t('platform.camera.clubs.noMappings')}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.camera.clubs.clubName')}</th>
                <th className="pb-3 pr-4 font-medium">
                  {t('platform.camera.clubs.starliveTeamName')}
                </th>
                <th className="pb-3 pr-4 font-medium">
                  {t('platform.camera.clubs.starliveTeamId')}
                </th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(mappings ?? []).map((m) => {
                const club = Array.isArray(m.clubs) ? m.clubs[0] : m.clubs
                return (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-foreground">{club?.name ?? '—'}</p>
                      <p className="text-xs text-foreground-muted">{club?.name_ka ?? ''}</p>
                    </td>
                    <td className="py-3 pr-4 text-foreground">{m.starlive_team_name}</td>
                    <td className="py-3 pr-4 text-foreground-muted">{m.starlive_team_id ?? '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/platform/camera/clubs/${m.id}/edit`}
                          className="text-primary hover:underline"
                        >
                          {t('common.edit')}
                        </Link>
                        <DeleteClubMappingButton
                          mappingId={m.id}
                          affectedCount={playerMapCounts.get(m.club_id) ?? 0}
                        />
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
