'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { demoRequestFormSchema } from '@/lib/validations'
import type { z } from 'zod'

type DemoRequestInput = z.infer<typeof demoRequestFormSchema>

export async function submitDemoRequest(data: DemoRequestInput, honeypot?: string) {
  // Honeypot: if filled, silently succeed (don't reveal detection to bots)
  if (honeypot) return { success: true as const }

  // Validate
  const parsed = demoRequestFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  // Get current user if logged in (optional)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Service role client required — demo_requests has REVOKE on anon/authenticated
  const admin = createAdminClient()

  // Duplicate check: if logged in and already has a linked request
  if (user) {
    const { data: existing } = await admin
      .from('demo_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) {
      return { error: 'demo.alreadySubmitted' }
    }
  }

  // Rate limit: max 3 submissions per email per hour
  const { count } = await admin
    .from('demo_requests')
    .select('id', { count: 'exact', head: true })
    .eq('email', parsed.data.email.toLowerCase())
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if (count && count >= 3) return { error: 'errors.rateLimitContact' }

  // Insert (normalize email to lowercase for consistent matching)
  const { error } = await admin.from('demo_requests').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email.toLowerCase(),
    organization: parsed.data.organization,
    role: parsed.data.role,
    country: parsed.data.country,
    message: parsed.data.message || null,
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error('[submit-demo-request] Insert error:', error.message)
    return { error: 'errors.serverError' }
  }

  return { success: true as const }
}
