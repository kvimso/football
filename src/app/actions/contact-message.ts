'use server'

import { contactMessageSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function submitContactMessage(formData: {
  name: string
  email: string
  subject?: string
  message: string
}) {
  const parsed = contactMessageSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }

  // Rate limit: max 3 messages per email per hour
  // Uses admin client because contact_messages has no SELECT policy
  const adminClient = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await adminClient
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('email', parsed.data.email)
    .gte('created_at', oneHourAgo)

  if (count !== null && count >= 3) {
    return { error: 'errors.rateLimitContact' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  })

  if (error) {
    console.error('[contact-message] Insert failed:', error.message)
    return { error: 'errors.failedToSendMessage' }
  }

  return { success: true }
}
