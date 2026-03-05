import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import type { Position } from '@/lib/types'
import { WatchlistList } from '@/components/dashboard/WatchlistList'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const { data: watchlistItems, error: wlError } = await supabase
    .from('watchlist')
    .select(`
      id, player_id, notes, created_at,
      player:players!watchlist_player_id_fkey (
        id, name, name_ka, slug, position, date_of_birth, photo_url,
        club:clubs!players_club_id_fkey ( name, name_ka )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (wlError) console.error('Failed to fetch watchlist:', wlError.message)

  const items = (watchlistItems ?? []).map((item) => {
    const player = unwrapRelation(item.player)
    if (!player) return null
    return {
      ...item,
      player: {
        ...player,
        position: player.position as Position,
        club: unwrapRelation(player.club),
      },
    }
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  return <WatchlistList items={items} />
}
