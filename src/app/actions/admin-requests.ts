'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getAdminContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', supabase: null, userId: null, clubId: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found', supabase: null, userId: null, clubId: null }
  if (profile.role !== 'academy_admin') {
    return { error: 'Unauthorized', supabase: null, userId: null, clubId: null }
  }
  if (!profile.club_id) return { error: 'No club assigned', supabase: null, userId: null, clubId: null }

  return { error: null, supabase, userId: user.id, clubId: profile.club_id }
}

async function verifyRequestBelongsToClub(supabase: Awaited<ReturnType<typeof createClient>>, requestId: string, clubId: string) {
  const { data: request, error } = await supabase
    .from('contact_requests')
    .select('id, player:players!contact_requests_player_id_fkey(club_id)')
    .eq('id', requestId)
    .single()

  if (error || !request) return false

  const player = Array.isArray(request.player) ? request.player[0] : request.player
  return player?.club_id === clubId
}

export async function approveRequest(requestId: string) {
  const { error: authErr, supabase, userId, clubId } = await getAdminContext()
  if (authErr || !supabase || !userId || !clubId) return { error: authErr ?? 'Unauthorized' }

  const belongs = await verifyRequestBelongsToClub(supabase, requestId, clubId)
  if (!belongs) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('contact_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  return { success: true }
}

export async function rejectRequest(requestId: string) {
  const { error: authErr, supabase, userId, clubId } = await getAdminContext()
  if (authErr || !supabase || !userId || !clubId) return { error: authErr ?? 'Unauthorized' }

  const belongs = await verifyRequestBelongsToClub(supabase, requestId, clubId)
  if (!belongs) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('contact_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  return { success: true }
}
