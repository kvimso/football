'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { todayDateString } from '@/lib/utils'
import { uuidSchema } from '@/lib/validations'

export async function platformAcceptTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'Unauthorized' }

  const { data: request, error: fetchErr } = await admin
    .from('transfer_requests')
    .select('id, player_id, from_club_id, to_club_id, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  // Accept transfer
  const { error: reqErr } = await admin
    .from('transfer_requests')
    .update({ status: 'accepted' as const, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqErr) return { error: reqErr.message }

  // Cancel other pending requests for this player
  const { error: declineErr } = await admin
    .from('transfer_requests')
    .update({ status: 'declined' as const, resolved_at: new Date().toISOString() })
    .eq('player_id', request.player_id)
    .eq('status', 'pending')
    .neq('id', requestId)

  if (declineErr) console.error('Failed to decline other transfer requests:', declineErr.message)

  // Transfer player
  const { error: playerErr } = await admin
    .from('players')
    .update({ club_id: request.to_club_id, updated_at: new Date().toISOString() })
    .eq('id', request.player_id)

  if (playerErr) return { error: playerErr.message }

  // Update club history
  if (request.from_club_id) {
    const { error: closeErr } = await admin
      .from('player_club_history')
      .update({ left_at: todayDateString() })
      .eq('player_id', request.player_id)
      .eq('club_id', request.from_club_id)
      .is('left_at', null)

    if (closeErr) console.error('Failed to close club history:', closeErr.message)
  }

  if (request.to_club_id) {
    const { error: histErr } = await admin
      .from('player_club_history')
      .insert({
        player_id: request.player_id,
        club_id: request.to_club_id,
        joined_at: todayDateString(),
      })

    if (histErr) console.error('Failed to insert club history:', histErr.message)
  }

  revalidatePath('/platform/transfers')
  revalidatePath('/platform/players')
  revalidatePath('/players')
  return { success: true }
}

export async function platformDeclineTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'Unauthorized' }

  const { data: request, error: fetchErr } = await admin
    .from('transfer_requests')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'Request not found' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  const { error: reqErr } = await admin
    .from('transfer_requests')
    .update({ status: 'declined' as const, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqErr) return { error: reqErr.message }

  revalidatePath('/platform/transfers')
  return { success: true }
}
