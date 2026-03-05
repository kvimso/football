'use server'

import { revalidatePath } from 'next/cache'
import { getAdminContext } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications/create'
import { uuidSchema } from '@/lib/validations'

const MAX_CONTENT_LENGTH = 500
const MAX_PER_WEEK = 2

export async function createAnnouncement(content: string) {
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > MAX_CONTENT_LENGTH) {
    return { error: 'admin.announcements.contentTooLong' }
  }

  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  // Rate limit: max 2 per week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { count, error: countErr } = await supabase
    .from('academy_announcements')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', clubId)
    .gte('created_at', oneWeekAgo.toISOString())

  if (countErr) return { error: 'errors.generic' }
  if ((count ?? 0) >= MAX_PER_WEEK) {
    return { error: 'admin.announcements.rateLimitReached' }
  }

  // Insert announcement
  const { error: insertErr } = await supabase
    .from('academy_announcements')
    .insert({ club_id: clubId, content: trimmed })

  if (insertErr) return { error: 'errors.generic' }

  // Get club name for notification title
  const { data: club } = await supabase
    .from('clubs')
    .select('name, slug')
    .eq('id', clubId)
    .single()

  const clubName = club?.name ?? 'Academy'
  const clubSlug = club?.slug ?? ''

  // Notify interested scouts (fire-and-forget)
  notifyInterestedScouts(clubId, clubName, clubSlug, trimmed).catch(() => {})

  revalidatePath('/admin/announcements')
  revalidatePath(`/clubs/${clubSlug}`)
  return { error: null }
}

export async function deleteAnnouncement(announcementId: string) {
  if (!uuidSchema.safeParse(announcementId).success) return { error: 'errors.invalidId' }

  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  // Verify ownership
  const { data: announcement } = await supabase
    .from('academy_announcements')
    .select('id, club_id')
    .eq('id', announcementId)
    .single()

  if (!announcement || announcement.club_id !== clubId) {
    return { error: 'errors.unauthorized' }
  }

  const { error: deleteErr } = await supabase
    .from('academy_announcements')
    .delete()
    .eq('id', announcementId)

  if (deleteErr) return { error: 'errors.generic' }

  revalidatePath('/admin/announcements')
  return { error: null }
}

/**
 * Find scouts interested in this club and create announcement notifications.
 * Targets: scouts who messaged, have players in watchlist, or viewed players in last 30 days.
 */
async function notifyInterestedScouts(
  clubId: string,
  clubName: string,
  clubSlug: string,
  content: string
): Promise<void> {
  const admin = createAdminClient()

  // Get club's player IDs
  const { data: players } = await admin
    .from('players')
    .select('id')
    .eq('club_id', clubId)
    .eq('status', 'active')

  const playerIds = (players ?? []).map(p => p.id)

  // 1. Scouts who have messaged this academy
  const { data: conversationScouts } = await admin
    .from('conversations')
    .select('scout_id')
    .eq('club_id', clubId)

  // 2. Scouts with this academy's players in watchlist
  const { data: watchlistScouts } = playerIds.length > 0
    ? await admin
        .from('watchlist')
        .select('user_id')
        .in('player_id', playerIds)
    : { data: [] }

  // 3. Scouts who viewed players in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: viewerScouts } = playerIds.length > 0
    ? await admin
        .from('player_views')
        .select('viewer_id')
        .in('player_id', playerIds)
        .gte('viewed_at', thirtyDaysAgo.toISOString())
    : { data: [] }

  // Deduplicate scout IDs
  const scoutIds = new Set<string>()
  for (const s of conversationScouts ?? []) scoutIds.add(s.scout_id)
  for (const s of watchlistScouts ?? []) scoutIds.add(s.user_id)
  for (const s of viewerScouts ?? []) scoutIds.add(s.viewer_id)

  if (scoutIds.size === 0) return

  // Truncate content for notification body
  const body = content.length > 100 ? content.slice(0, 97) + '...' : content

  // Create notifications for each scout
  const notifications = Array.from(scoutIds).map(scoutId =>
    createNotification({
      user_id: scoutId,
      type: 'announcement',
      title: `${clubName}: New Announcement`,
      body,
      club_id: clubId,
      link: `/clubs/${clubSlug}`,
    })
  )

  await Promise.allSettled(notifications)
}
