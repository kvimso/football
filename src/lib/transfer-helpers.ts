import type { SupabaseClient } from '@supabase/supabase-js'
import { todayDateString } from '@/lib/utils'

/**
 * Record a player joining a club in the club history table.
 */
export async function recordClubJoin(
  client: SupabaseClient,
  playerId: string,
  clubId: string,
): Promise<void> {
  const { error } = await client
    .from('player_club_history')
    .insert({
      player_id: playerId,
      club_id: clubId,
      joined_at: todayDateString(),
    })

  if (error) console.error('[transfer-helpers] Failed to insert club history:', error.message)
}

/**
 * Record a player departing a club by closing the open history record.
 */
export async function recordClubDeparture(
  client: SupabaseClient,
  playerId: string,
  clubId: string,
): Promise<void> {
  const { error } = await client
    .from('player_club_history')
    .update({ left_at: todayDateString() })
    .eq('player_id', playerId)
    .eq('club_id', clubId)
    .is('left_at', null)

  if (error) console.error('[transfer-helpers] Failed to close club history:', error.message)
}

/**
 * Execute the core transfer accept logic (shared between admin and platform).
 * Caller is responsible for auth checks before calling this.
 * Uses a PL/pgSQL function for atomicity — all 5 operations run in one transaction.
 */
export async function executeTransferAccept(
  client: SupabaseClient,
  requestId: string,
): Promise<{ error?: string }> {
  const { data, error } = await client.rpc('accept_transfer_request', {
    p_request_id: requestId,
  })

  if (error) {
    console.error('[transfer-helpers] Accept transfer RPC error:', error.message)
    return { error: 'errors.serverError' }
  }

  const result = data as { error?: string; success?: boolean } | null
  if (result?.error) return { error: result.error }

  return {}
}

/**
 * Execute the core transfer decline logic (shared between admin and platform).
 * Caller is responsible for auth checks before calling this.
 */
export async function executeTransferDecline(
  client: SupabaseClient,
  requestId: string,
): Promise<{ error?: string }> {
  const { error: reqErr } = await client
    .from('transfer_requests')
    .update({ status: 'declined' as const, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqErr) {
    console.error('[transfer-helpers] Decline error:', reqErr.message)
    return { error: 'errors.serverError' }
  }

  return {}
}
