import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | GFT',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { t } = await getServerT()
  const displayName = profile?.full_name || user.email || 'Scout'

  return (
    <div className="py-8">
      {/* Welcome card */}
      <div className="card">
        <h1 className="text-xl font-semibold text-foreground">
          {t('dashboard.welcome')}, {displayName}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">{t('dashboard.comingSoon')}</p>
        <Link href="/dashboard/messages" className="btn-primary mt-4 inline-block text-sm">
          {t('dashboard.goToMessages')}
        </Link>
      </div>
    </div>
  )
}
