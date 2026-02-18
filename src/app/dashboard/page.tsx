import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHome } from '@/components/dashboard/DashboardHome'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, organization')
    .eq('id', user.id)
    .single()

  if (profileError) console.error('Failed to fetch profile:', profileError.message)

  const { count: shortlistCount, error: slError } = await supabase
    .from('shortlists')
    .select('*', { count: 'exact', head: true })
    .eq('scout_id', user.id)

  if (slError) console.error('Failed to fetch shortlist count:', slError.message)

  const { count: requestCount, error: reqError } = await supabase
    .from('contact_requests')
    .select('*', { count: 'exact', head: true })
    .eq('scout_id', user.id)

  if (reqError) console.error('Failed to fetch request count:', reqError.message)

  return (
    <DashboardHome
      fullName={profile?.full_name ?? user.email ?? 'Scout'}
      shortlistCount={shortlistCount ?? 0}
      requestCount={requestCount ?? 0}
    />
  )
}
