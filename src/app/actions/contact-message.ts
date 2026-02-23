'use server'

import { contactMessageSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'

export async function submitContactMessage(formData: { name: string; email: string; message: string }) {
  const parsed = contactMessageSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  })

  if (error) {
    console.error('[contact-message] Insert failed:', error.message)
    return { error: 'Failed to send message. Please try again.' }
  }

  return { success: true }
}
