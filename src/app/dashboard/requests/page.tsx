import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'
import type { Position } from '@/lib/types'
import { RequestsList } from '@/components/dashboard/RequestsList'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) console.error('Failed to get user:', authError.message)
  if (!user) redirect('/login')

  const { data: requests, error: reqError } = await supabase
    .from('contact_requests')
    .select(`
      id, message, status, created_at, responded_at, expires_at, response_message,
      player:players!contact_requests_player_id_fkey (
        name, name_ka, slug, position,
        club:clubs!players_club_id_fkey ( name, name_ka )
      )
    `)
    .eq('scout_id', user.id)
    .order('created_at', { ascending: false })

  if (reqError) console.error('Failed to fetch requests:', reqError.message)

  const items = (requests ?? []).map((r) => {
    const player = unwrapRelation(r.player)
    return {
      ...r,
      player: player
        ? {
            ...player,
            position: player.position as Position,
            club: unwrapRelation(player.club),
          }
        : null,
    }
  })

  return <RequestsList items={items} />
}
