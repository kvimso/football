import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import { ShortlistList } from '@/components/dashboard/ShortlistList'

export default async function ShortlistPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const { data: shortlistItems, error: slError } = await supabase
    .from('shortlists')
    .select(`
      player_id, notes, created_at,
      player:players!shortlists_player_id_fkey (
        id, name, name_ka, slug, position, date_of_birth, photo_url,
        club:clubs!players_club_id_fkey ( name, name_ka )
      )
    `)
    .eq('scout_id', user.id)
    .order('created_at', { ascending: false })

  if (slError) console.error('Failed to fetch shortlist:', slError.message)

  const items = (shortlistItems ?? []).map((item) => {
    const player = unwrapRelation(item.player)
    if (!player) return null
    return {
      ...item,
      player: {
        ...player,
        club: unwrapRelation(player.club),
      },
    }
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  return <ShortlistList items={items} />
}
