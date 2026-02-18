'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Escape special PostgREST filter characters to prevent filter injection
function escapePostgrestValue(value: string): string {
  return value.replace(/[,.()"\\]/g, '')
}

async function getAdminContext() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', clubId: null, supabase: null, userId: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found', clubId: null, supabase: null, userId: null }
  if (profile.role !== 'academy_admin') {
    return { error: 'Unauthorized', clubId: null, supabase: null, userId: null }
  }

  if (!profile.club_id) return { error: 'No club assigned', clubId: null, supabase: null, userId: null }

  return { error: null, clubId: profile.club_id, supabase, userId: user.id }
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export async function releasePlayer(playerId: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id')
    .eq('id', playerId)
    .single()

  if (!player || player.club_id !== clubId) return { error: 'Unauthorized' }

  const admin = createAdminClient()

  const { error: updateErr } = await admin
    .from('players')
    .update({ club_id: null, status: 'free_agent' as const, updated_at: new Date().toISOString() })
    .eq('id', playerId)

  if (updateErr) return { error: updateErr.message }

  // Close club history
  const { error: historyErr } = await admin
    .from('player_club_history')
    .update({ left_at: today() })
    .eq('player_id', playerId)
    .eq('club_id', clubId)
    .is('left_at', null)

  if (historyErr) console.error('Failed to update club history:', historyErr.message)

  revalidatePath('/admin/players')
  revalidatePath('/admin')
  revalidatePath('/players')
  return { success: true }
}

export async function searchPlayersForTransfer(query: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized', players: [] }

  if (!query || query.trim().length < 2) return { error: null, players: [] }

  const sanitized = escapePostgrestValue(query.trim())
  if (!sanitized) return { error: null, players: [] }

  // Search other clubs' players and free agents in parallel
  const [{ data: players, error }, { data: freeAgents, error: faError }] = await Promise.all([
    supabase
      .from('players')
      .select(`
        id, name, name_ka, platform_id, position, date_of_birth, status,
        club:clubs!players_club_id_fkey ( id, name, name_ka )
      `)
      .neq('club_id', clubId)
      .or(`platform_id.ilike.%${sanitized}%,name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%`)
      .limit(10),
    supabase
      .from('players')
      .select(`
        id, name, name_ka, platform_id, position, date_of_birth, status,
        club:clubs!players_club_id_fkey ( id, name, name_ka )
      `)
      .is('club_id', null)
      .or(`platform_id.ilike.%${sanitized}%,name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%`)
      .limit(10),
  ])

  if (error) return { error: error.message, players: [] }
  if (faError) console.error('Failed to search free agents:', faError.message)

  const allPlayers = [...(players ?? []), ...(freeAgents ?? [])]
  // Deduplicate by id
  const seen = new Set<string>()
  const unique = allPlayers.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  return { error: null, players: unique }
}

export async function requestTransfer(playerId: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id, name, club:clubs!players_club_id_fkey(name)')
    .eq('id', playerId)
    .single()

  if (!player || !player.club_id) return { error: 'Player not found or is a free agent' }
  if (player.club_id === clubId) return { error: 'Player is already at your club' }

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('transfer_requests')
    .select('id')
    .eq('player_id', playerId)
    .eq('to_club_id', clubId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'A transfer request for this player is already pending' }

  const { error: insertErr } = await supabase
    .from('transfer_requests')
    .insert({
      player_id: playerId,
      from_club_id: player.club_id,
      to_club_id: clubId,
    })

  if (insertErr) return { error: insertErr.message }

  const club = Array.isArray(player.club) ? player.club[0] : player.club

  revalidatePath('/admin')
  return { success: true, clubName: club?.name ?? 'the club' }
}

export async function claimFreeAgent(playerId: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id, status, name')
    .eq('id', playerId)
    .single()

  if (!player) return { error: 'Player not found' }
  if (player.club_id !== null || player.status !== 'free_agent') {
    return { error: 'Player is not a free agent' }
  }

  const admin = createAdminClient()

  const { error: updateErr } = await admin
    .from('players')
    .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
    .eq('id', playerId)

  if (updateErr) return { error: updateErr.message }

  const { error: historyErr } = await admin
    .from('player_club_history')
    .insert({
      player_id: playerId,
      club_id: clubId,
      joined_at: today(),
    })

  if (historyErr) console.error('Failed to insert club history:', historyErr.message)

  revalidatePath('/admin')
  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true, playerName: player.name }
}

export async function acceptTransfer(requestId: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: request } = await supabase
    .from('transfer_requests')
    .select('id, player_id, from_club_id, to_club_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.from_club_id !== clubId) return { error: 'Unauthorized' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  const admin = createAdminClient()

  // Verify player is still at this club before transferring
  const { data: player } = await admin
    .from('players')
    .select('id, club_id')
    .eq('id', request.player_id)
    .single()

  if (!player || player.club_id !== clubId) {
    return { error: 'Player is no longer at your club' }
  }

  // Update this request
  const { error: reqErr } = await admin
    .from('transfer_requests')
    .update({ status: 'accepted' as const, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqErr) return { error: reqErr.message }

  // Cancel all other pending transfer requests for this player
  const { error: cancelErr } = await admin
    .from('transfer_requests')
    .update({ status: 'declined' as const, resolved_at: new Date().toISOString() })
    .eq('player_id', request.player_id)
    .eq('status', 'pending')
    .neq('id', requestId)

  if (cancelErr) console.error('Failed to cancel other pending requests:', cancelErr.message)

  // Transfer player
  const { error: playerErr } = await admin
    .from('players')
    .update({ club_id: request.to_club_id, updated_at: new Date().toISOString() })
    .eq('id', request.player_id)

  if (playerErr) return { error: playerErr.message }

  // Close old club history
  const { error: closeErr } = await admin
    .from('player_club_history')
    .update({ left_at: today() })
    .eq('player_id', request.player_id)
    .eq('club_id', request.from_club_id)
    .is('left_at', null)

  if (closeErr) console.error('Failed to close club history:', closeErr.message)

  // Insert new club history
  const { error: newHistErr } = await admin
    .from('player_club_history')
    .insert({
      player_id: request.player_id,
      club_id: request.to_club_id,
      joined_at: today(),
    })

  if (newHistErr) console.error('Failed to insert new club history:', newHistErr.message)

  revalidatePath('/admin')
  revalidatePath('/admin/players')
  revalidatePath('/admin/transfers')
  revalidatePath('/players')
  return { success: true }
}

export async function declineTransfer(requestId: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'Unauthorized' }

  const { data: request } = await supabase
    .from('transfer_requests')
    .select('id, from_club_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'Request not found' }
  if (request.from_club_id !== clubId) return { error: 'Unauthorized' }
  if (request.status !== 'pending') return { error: 'Request is no longer pending' }

  const { error: reqErr } = await supabase
    .from('transfer_requests')
    .update({ status: 'declined' as const, resolved_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqErr) return { error: reqErr.message }

  revalidatePath('/admin')
  revalidatePath('/admin/transfers')
  return { success: true }
}
