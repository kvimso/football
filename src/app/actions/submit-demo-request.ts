'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
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

  // Fire internal alert email — non-blocking.
  // Sandbox sender restricts delivery to the Resend account signup
  // (kvimsina@gmail.com). Forwarding to Levani is handled via a Gmail
  // filter until Binocly's domain is verified. See Haveinmind.md.
  try {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const html = `
<h2 style="font-family:Georgia,serif;margin:0 0 16px;color:#1A1917">New demo request</h2>
<table style="font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;border-collapse:collapse">
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Name</td><td style="padding:4px 0">${escapeHtml(parsed.data.full_name)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Email</td><td style="padding:4px 0">${escapeHtml(parsed.data.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Organisation</td><td style="padding:4px 0">${escapeHtml(parsed.data.organization)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Role</td><td style="padding:4px 0">${escapeHtml(parsed.data.role)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Country</td><td style="padding:4px 0">${escapeHtml(parsed.data.country)}</td></tr>
</table>
${
  parsed.data.message
    ? `<p style="margin:16px 0 0;padding:12px 16px;background:#F4F1EC;border-left:2px solid #1B8A4A;font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>`
    : ''
}
<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:13px">
  <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://football-v44v.vercel.app'}/platform/demo-requests" style="color:#1B8A4A;font-weight:600">Review in admin →</a>
</p>`

    await sendEmail({
      to: 'kvimsina@gmail.com',
      subject: `New demo request — ${parsed.data.full_name} · ${parsed.data.organization}`,
      html,
    })
  } catch (err) {
    // Email is fire-and-forget; log but do not fail the request.
    console.error('[submit-demo-request] Email alert failed:', err)
  }

  return { success: true as const }
}
