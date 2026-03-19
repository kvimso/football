import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { ClubMappingForm } from '@/components/platform/ClubMappingForm'

export default async function NewClubMappingPage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: clubs } = await admin.from('clubs').select('id, name, name_ka').order('name')

  return (
    <div>
      <Link
        href="/platform/camera/clubs"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        ← {t('platform.camera.clubs.title')}
      </Link>
      <h2 className="mt-3 text-lg font-semibold text-foreground">
        {t('platform.camera.clubs.addMapping')}
      </h2>
      <div className="mt-6 card p-6">
        <ClubMappingForm clubs={clubs ?? []} />
      </div>
    </div>
  )
}
