import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'

export default async function PlatformClubsPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: clubs, error } = await admin
    .from('clubs')
    .select('id, name, name_ka, slug, city, region')
    .order('name')

  if (error) console.error('Failed to fetch clubs:', error.message)

  // Get player and admin counts per club
  const clubIds = (clubs ?? []).map((c) => c.id)

  const [playersByClub, adminsByClub] = await Promise.all([
    clubIds.length > 0
      ? admin.from('players').select('club_id').in('club_id', clubIds).eq('status', 'active')
      : Promise.resolve({ data: [] as { club_id: string }[], error: null }),
    clubIds.length > 0
      ? admin.from('profiles').select('club_id').in('club_id', clubIds).eq('role', 'academy_admin')
      : Promise.resolve({ data: [] as { club_id: string }[], error: null }),
  ])

  const playerCountMap = new Map<string, number>()
  for (const p of playersByClub.data ?? []) {
    if (p.club_id) playerCountMap.set(p.club_id, (playerCountMap.get(p.club_id) ?? 0) + 1)
  }
  const adminCountMap = new Map<string, number>()
  for (const a of adminsByClub.data ?? []) {
    if (a.club_id) adminCountMap.set(a.club_id, (adminCountMap.get(a.club_id) ?? 0) + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('platform.clubs.title')}</h1>
        <Link href="/platform/clubs/new" className="btn-primary text-sm">
          {t('platform.clubs.addClub')}
        </Link>
      </div>

      {(clubs ?? []).length === 0 ? (
        <p className="mt-6 text-sm text-foreground-muted">{t('platform.clubs.noClubs')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">{t('platform.clubs.name')}</th>
                <th className="pb-3 pr-4 font-medium">{t('platform.clubs.city')}</th>
                <th className="pb-3 pr-4 font-medium text-center">{t('platform.clubs.playerCount')}</th>
                <th className="pb-3 pr-4 font-medium text-center">{t('platform.clubs.adminCount')}</th>
                <th className="pb-3 font-medium">{t('admin.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(clubs ?? []).map((club) => (
                <tr key={club.id} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">{club.name}</p>
                    <p className="text-xs text-foreground-muted">{club.name_ka}</p>
                  </td>
                  <td className="py-3 pr-4 text-foreground-muted">{club.city ?? '—'}</td>
                  <td className="py-3 pr-4 text-center text-foreground">{playerCountMap.get(club.id) ?? 0}</td>
                  <td className="py-3 pr-4 text-center text-foreground">{adminCountMap.get(club.id) ?? 0}</td>
                  <td className="py-3">
                    <Link
                      href={`/platform/clubs/${club.id}/edit`}
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
      )}
    </div>
  )
}
