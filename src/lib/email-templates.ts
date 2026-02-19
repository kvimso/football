interface ContactRequestReceivedParams {
  scoutName: string
  scoutOrg: string | null
  playerName: string
  message: string
}

interface ContactRequestStatusParams {
  scoutName: string
  playerName: string
  status: 'approved' | 'rejected'
  clubName: string
}

interface TransferRequestReceivedParams {
  playerName: string
  fromClubName: string
  toClubName: string
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f0d; color: #f0fdf4; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
  .card { background: #151d19; border: 1px solid #1e2b24; border-radius: 12px; padding: 24px; margin: 16px 0; }
  .header { font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 16px; }
  .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 8px 0; }
  .highlight { color: #f0fdf4; font-weight: 600; }
  .message-box { background: #0a0f0d; border-radius: 8px; padding: 16px; margin: 12px 0; font-size: 14px; color: #94a3b8; line-height: 1.5; }
  .footer { font-size: 12px; color: #64748b; margin-top: 24px; text-align: center; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  .badge-green { background: rgba(16,185,129,0.15); color: #10b981; }
  .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
`

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${baseStyles}</style></head>
<body><div class="container">${content}</div></body></html>`
}

export function contactRequestReceivedEmail({ scoutName, scoutOrg, playerName, message }: ContactRequestReceivedParams) {
  const orgLine = scoutOrg ? ` from <span class="highlight">${scoutOrg}</span>` : ''
  const html = wrap(`
    <div class="header">New Contact Request</div>
    <div class="card">
      <p class="text"><span class="highlight">${scoutName}</span>${orgLine} has sent a contact request for <span class="highlight">${playerName}</span>.</p>
      <div class="message-box">${message}</div>
      <p class="text">Log in to your admin panel to approve or reject this request.</p>
    </div>
    <div class="footer">Georgian Football Talent Platform</div>
  `)
  return { subject: `New contact request for ${playerName}`, html }
}

export function contactRequestStatusEmail({ scoutName, playerName, status, clubName }: ContactRequestStatusParams) {
  const isApproved = status === 'approved'
  const badgeClass = isApproved ? 'badge-green' : 'badge-red'
  const statusText = isApproved ? 'Approved' : 'Declined'
  const bodyText = isApproved
    ? `Your contact request for <span class="highlight">${playerName}</span> has been approved by <span class="highlight">${clubName}</span>. The club admin will be in touch.`
    : `Your contact request for <span class="highlight">${playerName}</span> has been declined by <span class="highlight">${clubName}</span>.`

  const html = wrap(`
    <div class="header">Contact Request Update</div>
    <div class="card">
      <p class="text">Hi ${scoutName},</p>
      <p class="text"><span class="badge ${badgeClass}">${statusText}</span></p>
      <p class="text">${bodyText}</p>
    </div>
    <div class="footer">Georgian Football Talent Platform</div>
  `)
  return { subject: `Contact request ${statusText.toLowerCase()}: ${playerName}`, html }
}

export function transferRequestReceivedEmail({ playerName, fromClubName, toClubName }: TransferRequestReceivedParams) {
  const html = wrap(`
    <div class="header">New Transfer Request</div>
    <div class="card">
      <p class="text"><span class="highlight">${toClubName}</span> has sent a transfer request for <span class="highlight">${playerName}</span>.</p>
      <p class="text">Log in to your admin panel to accept or decline this request. The request will expire in 7 days.</p>
    </div>
    <div class="footer">Georgian Football Talent Platform</div>
  `)
  return { subject: `Transfer request for ${playerName} from ${toClubName}`, html }
}
