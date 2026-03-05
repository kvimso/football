import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationList } from '@/components/dashboard/NotificationList'
import type { Notification } from '@/lib/notifications/types'

const PAGE_SIZE = 20

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (error) console.error('Failed to fetch notifications:', error.message)

  return (
    <NotificationList
      initialNotifications={(data ?? []) as Notification[]}
      initialTotal={count ?? 0}
    />
  )
}
