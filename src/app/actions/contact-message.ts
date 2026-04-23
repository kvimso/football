'use server'

import { contactMessageSchema } from '@/lib/validations'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

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

  // Fire internal alert email — non-blocking.
  // Sandbox sender delivers only to kvimsina@gmail.com until the
  // binocly.com domain is verified in Resend. See Haveinmind.md.
  try {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const subjectLine = parsed.data.subject
      ? `${parsed.data.subject.charAt(0).toUpperCase()}${parsed.data.subject.slice(1)}`
      : 'General'

    const html = `
<h2 style="font-family:Georgia,serif;margin:0 0 16px;color:#1A1917">New contact message</h2>
<table style="font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;border-collapse:collapse">
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Name</td><td style="padding:4px 0">${escapeHtml(parsed.data.name)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Email</td><td style="padding:4px 0">${escapeHtml(parsed.data.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#A39E97;text-transform:uppercase;letter-spacing:0.1em;font-size:11px">Subject</td><td style="padding:4px 0">${escapeHtml(subjectLine)}</td></tr>
</table>
<p style="margin:16px 0 0;padding:12px 16px;background:#F4F1EC;border-left:2px solid #1B8A4A;font-family:system-ui,sans-serif;font-size:14px;color:#1A1917;white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>
<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:13px;color:#A39E97">
  Reply directly to <a href="mailto:${escapeHtml(parsed.data.email)}" style="color:#1B8A4A;font-weight:600">${escapeHtml(parsed.data.email)}</a>.
</p>`

    await sendEmail({
      to: 'kvimsina@gmail.com',
      subject: `New contact message — ${parsed.data.name} · ${subjectLine}`,
      html,
    })
  } catch (err) {
    console.error('[contact-message] Email alert failed:', err)
  }

  return { success: true }
}
