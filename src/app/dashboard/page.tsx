import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import type { Notification } from '@/lib/notifications/types'

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

  const [watchlistResult, conversationResult, unreadResult, notificationsResult] = await Promise.all([
    supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('scout_id', user.id),
    supabase.rpc('get_total_unread_count'),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (watchlistResult.error) console.error('Failed to fetch watchlist count:', watchlistResult.error.message)
  if (conversationResult.error) console.error('Failed to fetch conversation count:', conversationResult.error.message)
  if (unreadResult.error) console.error('Failed to fetch unread count:', unreadResult.error.message)
  if (notificationsResult.error) console.error('Failed to fetch notifications:', notificationsResult.error.message)

  return (
    <DashboardHome
      fullName={profile?.full_name ?? user.email ?? 'Scout'}
      watchlistCount={watchlistResult.count ?? 0}
      messageCount={conversationResult.count ?? 0}
      unreadCount={Number(unreadResult.data ?? 0)}
      recentNotifications={(notificationsResult.data ?? []) as Notification[]}
    />
  )
}
