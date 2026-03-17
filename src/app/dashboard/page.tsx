import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardHome } from '@/components/dashboard/DashboardHome'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'
import type { WatchlistPanelItem } from '@/components/dashboard/WatchlistPanel'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel queries: profile, views, watchlist adds, messages, watchlist IDs, weekly view count, watchlist panel data
  const [
    profileResult,
    viewsResult,
    watchlistAddsResult,
    messagesResult,
    watchlistIdsResult,
    weeklyViewsResult,
    watchlistPanelResult,
    watchlistCountResult,
    unreadResult,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, organization').eq('id', user.id).single(),
    // Activity: recent player views
    supabase
      .from('player_views')
      .select(
        'viewed_at, player_id, player:players!player_views_player_id_fkey(name, name_ka, slug)'
      )
      .eq('viewer_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(10),
    // Activity: recent watchlist additions
    supabase
      .from('watchlist')
      .select('created_at, player:players!watchlist_player_id_fkey(name, name_ka, slug)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    // Activity: unread messages (via conversations the scout is part of)
    supabase
      .from('messages')
      .select(
        'created_at, conversation_id, conversation:conversations!messages_conversation_id_fkey(id, club:clubs!conversations_club_id_fkey(name, name_ka))'
      )
      .neq('sender_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    // Step A: watchlist player IDs for "watched player updates" query
    supabase.from('watchlist').select('player_id').eq('user_id', user.id),
    // Weekly view count for stat summary
    supabase
      .from('player_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewer_id', user.id)
      .gte('viewed_at', sevenDaysAgo),
    // Watchlist panel data (limited)
    supabase
      .from('watchlist')
      .select(
        'id, player_id, notes, created_at, player:players!watchlist_player_id_fkey(id, name, name_ka, slug, position, date_of_birth, photo_url, club:clubs!players_club_id_fkey(name, name_ka))'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    // Watchlist total count
    supabase.from('watchlist').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    // Unread count
    supabase.rpc('get_total_unread_count'),
  ])

  // Step B: watched player updates (players in watchlist updated in last 7 days)
  const watchlistPlayerIds = (watchlistIdsResult.data ?? []).map((r) => r.player_id)
  const watchedUpdatesResult =
    watchlistPlayerIds.length > 0
      ? await supabase
          .from('players')
          .select('updated_at, name, name_ka, slug')
          .in('id', watchlistPlayerIds)
          .gt('updated_at', sevenDaysAgo)
          .order('updated_at', { ascending: false })
          .limit(10)
      : { data: [] }

  // Get last_sign_in_at via admin client
  let lastSignInAt: string | null = null
  try {
    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    lastSignInAt = authUser?.user?.last_sign_in_at ?? null
  } catch {
    // Non-critical, skip silently
  }

  // Build activity items
  const activityItems: ActivityItem[] = []

  // Deduplicate views by player_id (keep most recent)
  const seenPlayerIds = new Set<string>()
  for (const view of viewsResult.data ?? []) {
    if (seenPlayerIds.has(view.player_id)) continue
    seenPlayerIds.add(view.player_id)
    const player = view.player as unknown as { name: string; name_ka: string; slug: string } | null
    if (player) {
      activityItems.push({
        type: 'view',
        timestamp: view.viewed_at,
        playerName: player.name,
        playerSlug: player.slug,
      })
    }
  }

  for (const item of watchlistAddsResult.data ?? []) {
    const player = item.player as unknown as { name: string; name_ka: string; slug: string } | null
    if (player && item.created_at) {
      activityItems.push({
        type: 'watchlist_add',
        timestamp: item.created_at,
        playerName: player.name,
        playerSlug: player.slug,
      })
    }
  }

  for (const msg of messagesResult.data ?? []) {
    const conv = msg.conversation as unknown as {
      id: string
      club: { name: string; name_ka: string } | null
    } | null
    if (conv?.club && msg.created_at) {
      activityItems.push({
        type: 'message',
        timestamp: msg.created_at,
        academyName: conv.club.name,
        conversationId: conv.id,
      })
    }
  }

  for (const player of watchedUpdatesResult.data ?? []) {
    if (player.updated_at) {
      activityItems.push({
        type: 'player_update',
        timestamp: player.updated_at,
        playerName: player.name,
        playerSlug: player.slug,
      })
    }
  }

  // Sort by timestamp descending, take first 20
  activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const topActivity = activityItems.slice(0, 20)

  // Unwrap watchlist panel items
  const watchlistItems = (watchlistPanelResult.data ?? []) as unknown as WatchlistPanelItem[]

  return (
    <DashboardHome
      fullName={profileResult.data?.full_name ?? user.email ?? 'Scout'}
      lastSignInAt={lastSignInAt}
      watchlistCount={watchlistCountResult.count ?? 0}
      unreadCount={Number(unreadResult.data ?? 0)}
      weeklyViewCount={weeklyViewsResult.count ?? 0}
      activityItems={topActivity}
      watchlistItems={watchlistItems}
    />
  )
}
