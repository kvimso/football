import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) console.error('Failed to get user:', error.message)
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
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8">
        <DashboardNav />
        <div className="mt-6">{children}</div>
      </div>
      <Footer />
    </>
  )
}
