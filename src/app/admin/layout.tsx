import { redirect } from 'next/navigation'
import { getCachedUser, getCachedAdminProfile } from '@/lib/cached-auth'
import { Navbar } from '@/components/layout/Navbar'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedAdminProfile(user.id)

  if (!profile || !['academy_admin', 'platform_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  if (profile.role === 'platform_admin') {
    redirect('/platform')
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-7xl flex-col px-4 pt-8">
        <div className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
          <AdminSidebar
            clubName={profile.club?.name ?? ''}
            clubNameKa={profile.club?.name_ka ?? ''}
          />
          <main className="min-h-0 min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </>
  )
}
