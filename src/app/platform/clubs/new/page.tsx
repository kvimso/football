import { getServerT } from '@/lib/server-translations'
import { ClubForm } from '@/components/platform/ClubForm'

export default async function PlatformNewClubPage() {
  const { t } = await getServerT()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('platform.clubs.addClub')}</h1>
      <div className="mt-6 card p-6">
        <ClubForm />
      </div>
    </div>
  )
}
