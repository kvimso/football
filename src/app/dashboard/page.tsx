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

  const [shortlistResult, conversationResult, unreadResult] = await Promise.all([
    supabase
      .from('shortlists')
      .select('*', { count: 'exact', head: true })
      .eq('scout_id', user.id),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('scout_id', user.id),
    supabase.rpc('get_total_unread_count'),
  ])

  if (shortlistResult.error) console.error('Failed to fetch shortlist count:', shortlistResult.error.message)
  if (conversationResult.error) console.error('Failed to fetch conversation count:', conversationResult.error.message)
  if (unreadResult.error) console.error('Failed to fetch unread count:', unreadResult.error.message)

  return (
    <DashboardHome
      fullName={profile?.full_name ?? user.email ?? 'Scout'}
      shortlistCount={shortlistResult.count ?? 0}
      messageCount={conversationResult.count ?? 0}
      unreadCount={Number(unreadResult.data ?? 0)}
    />
  )
}
