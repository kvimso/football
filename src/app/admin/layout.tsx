import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id, full_name, club:clubs!profiles_club_id_fkey(name, name_ka)')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to get profile:', profileError.message)

  if (!profile || (profile.role !== 'academy_admin' && profile.role !== 'platform_admin')) {
    redirect('/dashboard')
  }

  const club = Array.isArray(profile.club) ? profile.club[0] : profile.club

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <AdminSidebar
          clubName={club?.name ?? ''}
          clubNameKa={club?.name_ka ?? ''}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
