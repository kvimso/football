import Link from 'next/link'
import { getServerT } from '@/lib/server-translations'
import { PlayerForm } from '@/components/admin/PlayerForm'

export default async function AdminNewPlayerPage() {
  const { t } = await getServerT()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/players" className="text-sm text-foreground-muted hover:text-foreground">
          &larr; {t('admin.common.backToList')}
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('admin.players.addPlayer')}</h1>
      <PlayerForm />
    </div>
  )
}
