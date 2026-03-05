import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationPayload } from './types'

const MAX_NOTIFICATIONS = 200

/**
 * Trim notifications beyond MAX per user. Best-effort, errors swallowed.
 * Gets the created_at of the Nth newest, then deletes everything older.
 */
async function trimNotifications(admin: SupabaseClient, userIds: string[]): Promise<void> {
  for (const userId of [...new Set(userIds)]) {
    // Get the 200th notification (0-indexed offset 199)
    const { data } = await admin
      .from('notifications')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(MAX_NOTIFICATIONS - 1, MAX_NOTIFICATIONS - 1)

    if (!data || data.length === 0) continue

    // Delete everything strictly older than the cutoff
    await admin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', data[0].created_at)
  }
}

/**
 * Create notifications for all users watching a specific player.
 * Uses the admin client (service role) to bypass RLS for both
 * reading the watchlist and inserting notifications.
 */
export async function notifyWatchers(
  playerId: string,
  buildPayload: (userId: string) => Omit<NotificationPayload, 'user_id'>
): Promise<void> {
  const admin = createAdminClient()

  // Get all users watching this player
  const { data: watchers, error } = await admin
    .from('watchlist')
    .select('user_id')
    .eq('player_id', playerId)

  if (error || !watchers || watchers.length === 0) return

  const notifications = watchers.map(w => {
    const payload = buildPayload(w.user_id)
    return {
      user_id: w.user_id,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      player_id: payload.player_id ?? playerId,
      club_id: payload.club_id ?? null,
      link: payload.link ?? null,
    }
  })

  // Bulk insert — ignore errors silently (notifications are best-effort)
  await admin.from('notifications').insert(notifications)

  // Trim old notifications (fire-and-forget)
  trimNotifications(admin, watchers.map(w => w.user_id)).catch(() => {})
}

/**
 * Create a single notification for a specific user.
 */
export async function createNotification(
  payload: NotificationPayload
): Promise<void> {
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

  // Trim old notifications (fire-and-forget)
  trimNotifications(admin, [payload.user_id]).catch(() => {})
}

// --- Typed notification creators for each event type ---

/** Player transferred to a new club */
export async function notifyClubChange(
  playerId: string,
  playerName: string,
  playerSlug: string,
  newClubName: string,
  newClubId: string
): Promise<void> {
  await notifyWatchers(playerId, () => ({
    type: 'club_change',
    title: `${playerName} transferred to ${newClubName}`,
    player_id: playerId,
    club_id: newClubId,
    link: `/players/${playerSlug}`,
  }))
}

/** Player became a free agent */
export async function notifyFreeAgent(
  playerId: string,
  playerName: string,
  playerSlug: string
): Promise<void> {
  await notifyWatchers(playerId, () => ({
    type: 'free_agent',
    title: `${playerName} is now a free agent`,
    player_id: playerId,
    link: `/players/${playerSlug}`,
  }))
}

/** Player scored a goal (Phase 7 — camera integration) */
export async function notifyGoal(
  playerId: string,
  playerName: string,
  playerSlug: string,
  opponentName: string
): Promise<void> {
  await notifyWatchers(playerId, () => ({
    type: 'goal',
    title: `${playerName} scored vs ${opponentName}`,
    player_id: playerId,
    link: `/players/${playerSlug}`,
  }))
}

/** Player made an assist (Phase 7 — camera integration) */
export async function notifyAssist(
  playerId: string,
  playerName: string,
  playerSlug: string,
  opponentName: string
): Promise<void> {
  await notifyWatchers(playerId, () => ({
    type: 'assist',
    title: `${playerName} assisted vs ${opponentName}`,
    player_id: playerId,
    link: `/players/${playerSlug}`,
  }))
}

/** New highlight video for a player (Phase 7 — camera integration) */
export async function notifyNewVideo(
  playerId: string,
  playerName: string,
  playerSlug: string
): Promise<void> {
  await notifyWatchers(playerId, () => ({
    type: 'new_video',
    title: `New highlight for ${playerName}`,
    player_id: playerId,
    link: `/players/${playerSlug}`,
  }))
}
