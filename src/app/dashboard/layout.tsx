import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'academy_admin') redirect('/admin')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
