import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import type { Position } from '@/lib/types'
import { WatchlistPage } from '@/components/dashboard/WatchlistPage'

export default async function WatchlistServerPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  // Fetch all watchlist data in parallel
  const [
    { data: watchlistItems, error: wlError },
    { data: folders, error: foldersError },
    { data: folderAssignments, error: assignError },
    { data: tags, error: tagsError },
  ] = await Promise.all([
    supabase
      .from('watchlist')
      .select(
        `
        id, player_id, notes, created_at,
        player:players!watchlist_player_id_fkey (
          id, name, name_ka, slug, position, date_of_birth, photo_url,
          club:clubs!players_club_id_fkey ( name, name_ka )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('watchlist_folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    supabase.from('watchlist_folder_players').select('id, folder_id, watchlist_id'),
    supabase.from('watchlist_tags').select('id, watchlist_id, tag').eq('user_id', user.id),
  ])

  if (wlError) console.error('Failed to fetch watchlist:', wlError.message)
  if (foldersError) console.error('Failed to fetch folders:', foldersError.message)
  if (assignError) console.error('Failed to fetch folder assignments:', assignError.message)
  if (tagsError) console.error('Failed to fetch tags:', tagsError.message)

  const items = (watchlistItems ?? [])
    .map((item) => {
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
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  // Build tag map: watchlistId -> tags[]
  const tagMap: Record<string, Array<{ id: string; tag: string }>> = {}
  for (const t of tags ?? []) {
    if (!tagMap[t.watchlist_id]) tagMap[t.watchlist_id] = []
    tagMap[t.watchlist_id].push({ id: t.id, tag: t.tag })
  }

  // Build folder assignment map: watchlistId -> folderIds[]
  const folderAssignmentMap: Record<string, string[]> = {}
  for (const a of folderAssignments ?? []) {
    if (!folderAssignmentMap[a.watchlist_id]) folderAssignmentMap[a.watchlist_id] = []
    folderAssignmentMap[a.watchlist_id].push(a.folder_id)
  }

  return (
    <WatchlistPage
      items={items}
      folders={folders ?? []}
      tagMap={tagMap}
      folderAssignmentMap={folderAssignmentMap}
    />
  )
}
