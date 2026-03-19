import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { PlayerMappingForm } from '@/components/platform/PlayerMappingForm'

export default async function NewPlayerMappingPage() {
  const { t } = await getServerT()

  return (
    <div>
      <Link
        href="/platform/camera/mappings"
        className="text-sm text-foreground-muted hover:text-foreground transition-colors"
      >
        ← {t('platform.camera.mappings.title')}
      </Link>
      <h2 className="mt-3 text-lg font-semibold text-foreground">
        {t('platform.camera.mappings.addMapping')}
      </h2>
      <div className="mt-6 card p-6">
        <PlayerMappingForm />
      </div>
    </div>
  )
}
