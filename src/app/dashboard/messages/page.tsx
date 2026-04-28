import { permanentRedirect } from 'next/navigation'

export default function LegacyScoutMessagesPage() {
  permanentRedirect('/messages')
}
