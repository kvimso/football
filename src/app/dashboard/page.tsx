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

  const { t } = await getServerT()

  const [{ data: profile }, { data: leagues }, { data: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('leagues').select('*').eq('is_active', true).order('display_order').limit(3),
    supabase.rpc('get_total_unread_count'),
  ])

  const displayName = profile?.full_name || user.email || 'Scout'

  return (
    <div className="py-8 space-y-8">
      {/* Welcome card */}
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-foreground">
          {t('dashboard.welcome')}, {displayName}
        </h1>
      </div>

      {/* Messages card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('dashboard.messagesCard')}</h2>
            {typeof unreadCount === 'number' && unreadCount > 0 && (
              <p className="mt-1 text-sm text-primary font-medium">
                {unreadCount} {t('dashboard.unreadCount')}
              </p>
            )}
          </div>
          <Link href="/dashboard/messages" className="btn-primary text-sm">
            {t('dashboard.viewMessages')}
          </Link>
        </div>
      </div>

      {/* Leagues section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('dashboard.leaguesSection')}</h2>
          <Link href="/leagues" className="text-sm text-primary hover:underline">
            {t('dashboard.viewAllLeagues')}
          </Link>
        </div>

        {(leagues ?? []).length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(leagues ?? []).map((league) => (
              <a
                key={league.id}
                href={league.starlive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-medium text-foreground">{league.name}</h3>
                {league.age_group && (
                  <p className="mt-1 text-xs text-foreground-muted">{league.age_group}</p>
                )}
                {league.season && (
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {t('leagues.season')}: {league.season}
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">{t('dashboard.noLeagues')}</p>
        )}
      </div>
    </div>
  )
}
