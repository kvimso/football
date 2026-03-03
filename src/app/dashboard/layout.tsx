import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/cached-auth'
import { Navbar } from '@/components/layout/Navbar'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, supabase } = await getCachedUser()
  if (!user) redirect('/login')

  // Redirect academy admins to their admin panel
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to fetch profile:', profileError.message)

  if (profile?.role === 'academy_admin') redirect('/admin')
  if (profile?.role === 'platform_admin') redirect('/platform')

  return (
    <>
      <Navbar />
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-7xl flex-col px-4 pt-8">
        <DashboardNav />
        <div className="mt-6 min-h-0 flex-1">{children}</div>
      </div>
    </>
  )
}
