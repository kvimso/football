import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  // Defense-in-depth: middleware handles role routing, but guard here too
  const [profileResult, watchlistResult, unreadResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.rpc('get_total_unread_count'),
  ])

  if (profileResult.data?.role !== 'scout') notFound()

  return (
    <>
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100dvh-var(--navbar-height))] max-w-7xl">
        <DashboardSidebar
          watchlistCount={watchlistResult.count ?? 0}
          unreadCount={Number(unreadResult.data ?? 0)}
        />
        <main className="flex-1 min-w-0 px-4 pt-8 pb-20 md:pb-8">{children}</main>
      </div>
      <Footer />
    </>
  )
}
