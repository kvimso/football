import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationPayload } from './types'

const MAX_NOTIFICATIONS = 200

async function trimNotifications(admin: SupabaseClient, userIds: string[]): Promise<void> {
  for (const userId of [...new Set(userIds)]) {
    const { data } = await admin
      .from('notifications')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(MAX_NOTIFICATIONS - 1, MAX_NOTIFICATIONS - 1)

    if (!data || data.length === 0) continue

    await admin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', data[0].created_at)
  }
}

/**
 * Create a single notification for a specific user.
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    player_id: payload.player_id ?? null,
    club_id: payload.club_id ?? null,
    link: payload.link ?? null,
  })

  trimNotifications(admin, [payload.user_id]).catch(() => {})
}
