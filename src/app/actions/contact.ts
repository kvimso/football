'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { contactRequestSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/email'
import { contactRequestReceivedEmail } from '@/lib/email-templates'

export async function sendContactRequest(playerId: string, message: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) return { error: authError.message }
  if (!user) return { error: 'Not authenticated' }

  // Validate with Zod schema
  const parsed = contactRequestSchema.safeParse({ playerId, message })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  // Check player status — contact only allowed for active players
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id, name, club_id, status')
    .eq('id', parsed.data.playerId)
    .single()

  if (playerError || !player) return { error: 'Player not found' }
  if (player.status === 'free_agent') return { error: 'Contact is not available for free agents' }

  // Check if request already exists
  const { data: existing, error: checkError } = await supabase
    .from('contact_requests')
    .select('id')
    .eq('scout_id', user.id)
    .eq('player_id', playerId)
    .maybeSingle()

  if (checkError) return { error: checkError.message }
  if (existing) return { error: 'You have already sent a request for this player' }

  const { error } = await supabase
    .from('contact_requests')
    .insert({
      scout_id: user.id,
      player_id: parsed.data.playerId,
      message: parsed.data.message.trim(),
    })

  if (error) return { error: error.message }

  // Send email notification to club admin (fire-and-forget)
  if (player.club_id) {
    const admin = createAdminClient()
    Promise.all([
      admin.from('profiles').select('email').eq('club_id', player.club_id).eq('role', 'academy_admin').limit(1).single(),
      admin.from('profiles').select('full_name, organization').eq('id', user.id).single(),
    ]).then(([clubAdminResult, scoutResult]) => {
      if (clubAdminResult.error) {
        console.error('Failed to fetch club admin for email:', clubAdminResult.error.message)
        return
      }
      if (scoutResult.error) {
        console.error('Failed to fetch scout profile for email:', scoutResult.error.message)
      }
      const clubAdminEmail = clubAdminResult.data?.email
      const scoutName = scoutResult.data?.full_name ?? 'A scout'
      const scoutOrg = scoutResult.data?.organization ?? null
      if (clubAdminEmail) {
        const template = contactRequestReceivedEmail({
          scoutName,
          scoutOrg,
          playerName: player.name,
          message: parsed.data.message.trim(),
        })
        sendEmail({ to: clubAdminEmail, ...template })
      }
    }).catch((err) => console.error('Failed to send contact request email:', err))
  }

  revalidatePath('/dashboard/requests')
  return { success: true }
}
