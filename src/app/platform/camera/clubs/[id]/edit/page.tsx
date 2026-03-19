import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { ClubMappingForm } from '@/components/platform/ClubMappingForm'

export default async function EditClubMappingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { t } = await getServerT()
  const admin = createAdminClient()

  const [mappingResult, clubsResult] = await Promise.all([
    admin.from('starlive_club_map').select('*').eq('id', id).single(),
    admin.from('clubs').select('id, name, name_ka').order('name'),
  ])

  if (mappingResult.error || !mappingResult.data) notFound()

  return (
    <div>
      <Link
        href="/platform/camera/clubs"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        ← {t('platform.camera.clubs.title')}
      </Link>
      <h2 className="mt-3 text-lg font-semibold text-foreground">
        {t('platform.camera.clubs.editMapping')}
      </h2>
      <div className="mt-6 card p-6">
        <ClubMappingForm mapping={mappingResult.data} clubs={clubsResult.data ?? []} />
      </div>
    </div>
  )
}
