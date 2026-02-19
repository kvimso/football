import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlatformSidebar } from '@/components/platform/PlatformSidebar'

export default async function PlatformLayout({
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
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to get profile:', profileError.message)

  if (!profile || profile.role !== 'platform_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <PlatformSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
