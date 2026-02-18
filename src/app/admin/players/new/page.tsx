import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { PlayerForm } from '@/components/admin/PlayerForm'

export default async function AdminNewPlayerPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'academy_admin' || !profile.club_id) {
    redirect('/dashboard')
  }

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
