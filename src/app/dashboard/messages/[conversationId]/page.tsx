import { permanentRedirect } from 'next/navigation'

export default async function LegacyScoutConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  permanentRedirect(`/messages/${conversationId}`)
}
