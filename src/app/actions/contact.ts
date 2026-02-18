'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { contactRequestSchema } from '@/lib/validations'

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

  revalidatePath('/dashboard/requests')
  return { success: true }
}
