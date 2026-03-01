'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminContext } from '@/lib/auth'
import { unwrapRelation } from '@/lib/utils'
import { uuidSchema, responseMessageSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email'
import { contactRequestStatusEmail } from '@/lib/email-templates'

async function verifyRequestBelongsToClub(supabase: Awaited<ReturnType<typeof createClient>>, requestId: string, clubId: string) {
  const { data: request, error } = await supabase
    .from('contact_requests')
    .select('id, player:players!contact_requests_player_id_fkey(club_id)')
    .eq('id', requestId)
    .single()

  if (error || !request) return false

  const player = unwrapRelation(request.player)
  return player?.club_id === clubId
}

export async function approveRequest(requestId: string, responseMessage?: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  if (responseMessage !== undefined) {
    const msgParsed = responseMessageSchema.safeParse(responseMessage)
    if (!msgParsed.success) return { error: msgParsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }
  const { error: authErr, supabase, userId, clubId } = await getAdminContext()
  if (authErr || !supabase || !userId || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const belongs = await verifyRequestBelongsToClub(supabase, requestId, clubId)
  if (!belongs) return { error: 'errors.unauthorized' }

  const { error } = await supabase
    .from('contact_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
      response_message: responseMessage?.trim() || null,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  // Send email notification to scout (fire-and-forget)
  sendRequestStatusEmail(requestId, 'approved')

  revalidatePath('/admin/requests')
  return { success: true }
}

export async function rejectRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, supabase, userId, clubId } = await getAdminContext()
  if (authErr || !supabase || !userId || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const belongs = await verifyRequestBelongsToClub(supabase, requestId, clubId)
  if (!belongs) return { error: 'errors.unauthorized' }

  const { error } = await supabase
    .from('contact_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  // Send email notification to scout (fire-and-forget)
  sendRequestStatusEmail(requestId, 'rejected')

  revalidatePath('/admin/requests')
  return { success: true }
}

async function sendRequestStatusEmail(requestId: string, status: 'approved' | 'rejected') {
  try {
    const admin = createAdminClient()
    const { data: request } = await admin
      .from('contact_requests')
      .select(`
        scout_id,
        player:players!contact_requests_player_id_fkey ( name, club:clubs!players_club_id_fkey ( name ) )
      `)
      .eq('id', requestId)
      .single()

    if (!request || !request.scout_id) return

    const { data: scout } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', request.scout_id)
      .single()

    if (!scout?.email) return

    const player = unwrapRelation(request.player)
    const club = player?.club ? unwrapRelation(player.club) : null

    const template = contactRequestStatusEmail({
      scoutName: scout.full_name ?? 'Scout',
      playerName: player?.name ?? 'Unknown',
      status,
      clubName: club?.name ?? 'the club',
    })
    sendEmail({ to: scout.email, ...template })
  } catch (err) {
    console.error('Failed to send request status email:', err)
  }
}
