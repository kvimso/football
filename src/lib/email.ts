import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (resend) return resend

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set — emails will not be sent')
    return null
  }

  resend = new Resend(apiKey)
  return resend
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const client = getResend()
  if (!client) return

  try {
    const { error } = await client.emails.send({
      from: 'Georgian Football Platform <noreply@georgianfootball.com>',
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Failed to send email:', error.message)
    }
  } catch (err) {
    console.error('Email send error:', err)
  }
}
