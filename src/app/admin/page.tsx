import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardQuickActions } from '@/components/admin/DashboardQuickActions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to fetch profile:', profileError.message)
  if (!profile?.club_id) {
    return (
      <div className="p-8 text-center text-foreground-muted">
        <p>You are not assigned to a club yet. Contact a platform admin.</p>
      </div>
    )
  }

  const clubId = profile.club_id

  const [clubResult, playerCountResult, unreadResult] = await Promise.all([
    supabase.from('clubs').select('name, slug, logo_url').eq('id', clubId).single(),
    supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('status', 'active'),
    supabase.rpc('get_total_unread_count'),
  ])

  if (playerCountResult.error)
    console.error('Failed to fetch player count:', playerCountResult.error.message)
  if (unreadResult.error) console.error('Failed to fetch unread count:', unreadResult.error.message)

  const club = clubResult.data
  const playerCount = playerCountResult.count ?? 0
  const unreadCount = Number(unreadResult.data ?? 0)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              {club?.name ?? 'Your academy'}
            </h1>
            <p className="text-sm text-foreground-muted">Academy dashboard</p>
          </div>
          {club?.slug && (
            <Link
              href={`/clubs/${club.slug}`}
              className="ml-auto text-sm font-medium text-primary hover:underline"
            >
              View public page →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/players"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/30"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
            Active players
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{playerCount}</p>
          <p className="mt-1 text-sm text-foreground-muted">Manage roster →</p>
        </Link>
        <Link
          href="/admin/messages"
          className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary/30"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
            Unread messages
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{unreadCount}</p>
          <p className="mt-1 text-sm text-foreground-muted">Open inbox →</p>
        </Link>
      </div>

      <DashboardQuickActions
        labels={{
          quickActions: 'Quick actions',
          addPlayer: 'Add player',
          messages: 'Messages',
          players: 'Players',
          transfers: 'Transfers',
        }}
        unreadCount={unreadCount}
      />
    </div>
  )
}
