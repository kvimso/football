'use server'

import { contactMessageSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'

export async function submitContactMessage(formData: {
  name: string
  email: string
  message: string
}) {
  const parsed = contactMessageSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }

  const supabase = await createClient()

  // Rate limit: max 3 messages per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('email', parsed.data.email)
    .gte('created_at', oneHourAgo)

  if (count !== null && count >= 3) {
    return { error: 'errors.rateLimitContact' }
  }

  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  })

  if (error) {
    console.error('[contact-message] Insert failed:', error.message)
    return { error: 'errors.failedToSendMessage' }
  }

  return { success: true }
}
