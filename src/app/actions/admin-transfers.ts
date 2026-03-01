'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminContext } from '@/lib/auth'
import { unwrapRelation, escapePostgrestValue } from '@/lib/utils'
import { recordClubJoin, recordClubDeparture, executeTransferAccept, executeTransferDecline } from '@/lib/transfer-helpers'
import { uuidSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email'
import { transferRequestReceivedEmail } from '@/lib/email-templates'

export async function releasePlayer(playerId: string) {
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id')
    .eq('id', playerId)
    .single()

  if (!player || player.club_id !== clubId) return { error: 'errors.unauthorized' }

  const admin = createAdminClient()

  const { error: updateErr, data: released } = await admin
    .from('players')
    .update({ club_id: null, status: 'free_agent' as const, updated_at: new Date().toISOString() })
    .eq('id', playerId)
    .eq('club_id', clubId)
    .select('id')

  if (updateErr) {
    console.error('[admin-transfers] Release error:', updateErr.message)
    return { error: 'errors.serverError' }
  }
  if (!released || released.length === 0) return { error: 'errors.playerNoLongerAtClub' }

  await recordClubDeparture(admin, playerId, clubId)

  revalidatePath('/admin/players')
  revalidatePath('/admin')
  revalidatePath('/players')
  return { success: true }
}

export async function searchPlayersForTransfer(query: string) {
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized', players: [] }

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

  if (error) {
    console.error('[admin-transfers] Search error:', error.message)
    return { error: 'errors.serverError', players: [] }
  }
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
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id, name, club:clubs!players_club_id_fkey(name)')
    .eq('id', playerId)
    .single()

  if (!player || !player.club_id) return { error: 'errors.playerNotFoundOrFreeAgent' }
  if (player.club_id === clubId) return { error: 'errors.playerAlreadyAtClub' }

  // Check for existing pending request
  const { data: existing } = await supabase
    .from('transfer_requests')
    .select('id')
    .eq('player_id', playerId)
    .eq('to_club_id', clubId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'errors.transferAlreadyPending' }

  const { error: insertErr } = await supabase
    .from('transfer_requests')
    .insert({
      player_id: playerId,
      from_club_id: player.club_id,
      to_club_id: clubId,
    })

  if (insertErr) {
    console.error('[admin-transfers] Transfer request insert error:', insertErr.message)
    return { error: 'errors.serverError' }
  }

  const club = unwrapRelation(player.club)

  // Send email notification to the receiving club admin (fire-and-forget)
  try {
    const admin = createAdminClient()
    const [clubAdminResult, myClubResult] = await Promise.all([
      admin.from('profiles').select('email').eq('club_id', player.club_id).eq('role', 'academy_admin').limit(1).single(),
      admin.from('clubs').select('name').eq('id', clubId).single(),
    ])
    const clubAdminEmail = clubAdminResult.data?.email
    const myClubName = myClubResult.data?.name ?? 'Another club'
    if (clubAdminEmail) {
      const template = transferRequestReceivedEmail({
        playerName: player.name,
        fromClubName: club?.name ?? 'Unknown',
        toClubName: myClubName,
      })
      sendEmail({ to: clubAdminEmail, ...template })
    }
  } catch (err) {
    console.error('Failed to send transfer request email:', err)
  }

  revalidatePath('/admin')
  return { success: true, clubName: club?.name ?? 'the club' }
}

export async function claimFreeAgent(playerId: string) {
  if (!uuidSchema.safeParse(playerId).success) return { error: 'errors.invalidId' }
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const { data: player } = await supabase
    .from('players')
    .select('id, club_id, status, name')
    .eq('id', playerId)
    .single()

  if (!player) return { error: 'errors.playerNotFound' }
  if (player.club_id !== null || player.status !== 'free_agent') {
    return { error: 'errors.playerNotFreeAgent' }
  }

  const admin = createAdminClient()

  const { error: updateErr, data: updated } = await admin
    .from('players')
    .update({ club_id: clubId, status: 'active' as const, updated_at: new Date().toISOString() })
    .eq('id', playerId)
    .is('club_id', null)
    .eq('status', 'free_agent')
    .select('id')

  if (updateErr) {
    console.error('[admin-transfers] Claim error:', updateErr.message)
    return { error: 'errors.serverError' }
  }
  if (!updated || updated.length === 0) return { error: 'errors.playerNoLongerFreeAgent' }

  await recordClubJoin(admin, playerId, clubId)

  revalidatePath('/admin')
  revalidatePath('/admin/players')
  revalidatePath('/players')
  return { success: true, playerName: player.name }
}

export async function acceptTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const { data: request } = await supabase
    .from('transfer_requests')
    .select('id, player_id, from_club_id, to_club_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'errors.requestNotFound' }
  if (request.from_club_id !== clubId) return { error: 'errors.unauthorized' }
  if (request.status !== 'pending') return { error: 'errors.requestNoLongerPending' }

  const admin = createAdminClient()
  const result = await executeTransferAccept(admin, request.id)
  if (result.error) return { error: result.error }

  revalidatePath('/admin')
  revalidatePath('/admin/players')
  revalidatePath('/admin/transfers')
  revalidatePath('/players')
  return { success: true }
}

export async function declineTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, clubId, supabase } = await getAdminContext()
  if (authErr || !supabase || !clubId) return { error: authErr ?? 'errors.unauthorized' }

  const { data: request } = await supabase
    .from('transfer_requests')
    .select('id, from_club_id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: 'errors.requestNotFound' }
  if (request.from_club_id !== clubId) return { error: 'errors.unauthorized' }
  if (request.status !== 'pending') return { error: 'errors.requestNoLongerPending' }

  const result = await executeTransferDecline(supabase, requestId)
  if (result.error) return { error: result.error }

  revalidatePath('/admin')
  revalidatePath('/admin/transfers')
  return { success: true }
}
