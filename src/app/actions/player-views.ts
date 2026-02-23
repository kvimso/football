'use server'

import { createClient } from '@/lib/supabase/server'

export async function trackPlayerView(playerId: string): Promise<void> {
  try {
    // Validate playerId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(playerId)) return

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get viewer's profile to check role and club_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, club_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    // Skip if academy_admin viewing their own club's player
    if (profile.role === 'academy_admin' && profile.club_id) {
      const { data: player } = await supabase
        .from('players')
        .select('club_id')
        .eq('id', playerId)
        .single()

      if (player?.club_id === profile.club_id) return
    }

    // Dedup: check for existing view within last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentView } = await supabase
      .from('player_views')
      .select('id')
      .eq('player_id', playerId)
      .eq('viewer_id', user.id)
      .gte('viewed_at', oneHourAgo)
      .limit(1)
      .maybeSingle()

    if (recentView) return

    // Insert the view
    const { error } = await supabase
      .from('player_views')
      .insert({ player_id: playerId, viewer_id: user.id })

    if (error) console.error('Failed to track player view:', error.message)
  } catch {
    // Silently fail — analytics should never crash the app
  }
}
