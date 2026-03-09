'use server'

import { createClient } from '@/lib/supabase/server'
import type { Notification, NotificationType } from '@/lib/notifications/types'

const VALID_TYPES: NotificationType[] = [
  'goal',
  'assist',
  'club_change',
  'free_agent',
  'new_video',
  'announcement',
]

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}

export async function getRecentNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as Notification[]
}

export async function markAsRead(notificationId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return {}
}

export interface NotificationFilters {
  type?: NotificationType
  readStatus?: 'all' | 'unread' | 'read'
}

export interface NotificationsPage {
  notifications: Notification[]
  total: number
}

const PAGE_SIZE = 20

export async function getNotificationsPage(
  page: number,
  filters?: NotificationFilters
): Promise<NotificationsPage> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { notifications: [], total: 0 }

  const offset = Math.max(0, page - 1) * PAGE_SIZE

  let query = supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', user.id)

  if (filters?.type && VALID_TYPES.includes(filters.type)) {
    query = query.eq('type', filters.type)
  }
  if (filters?.readStatus === 'unread') {
    query = query.eq('is_read', false)
  } else if (filters?.readStatus === 'read') {
    query = query.eq('is_read', true)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error || !data) return { notifications: [], total: 0 }
  return { notifications: data as Notification[], total: count ?? 0 }
}

export async function markAllAsRead(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: error.message }
  return {}
}
