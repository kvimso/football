import { createAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/server-translations'
import { InviteForm } from '@/components/admin/InviteForm'

export default async function PlatformInvitePage() {
  const { t } = await getServerT()
  const admin = createAdminClient()

  const { data: clubs } = await admin
    .from('clubs')
    .select('id, name, name_ka')
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('admin.invite.title')}</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        {t('admin.invite.subtitle')}
      </p>
      <div className="mt-6 max-w-md">
        <InviteForm clubs={clubs ?? []} />
      </div>
    </div>
  )
}
