import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { InviteForm } from '@/components/admin/InviteForm'

export default async function InvitePage() {
  const supabase = await createClient()
  const { t } = await getServerT()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'platform_admin') {
    redirect('/admin')
  }

  const { data: clubs } = await supabase
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
