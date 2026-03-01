import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchConversationById, fetchInitialMessages } from '@/lib/chat-queries'
import { ChatThread } from '@/components/chat/ChatThread'

export default async function ScoutConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const conversation = await fetchConversationById(supabase, conversationId, user.id, 'scout')
  if (!conversation) notFound()

  const { messages, has_more } = await fetchInitialMessages(supabase, conversationId)

  return (
    <ChatThread
      conversation={conversation}
      initialMessages={messages}
      hasMoreInitial={has_more}
      userId={user.id}
      userRole="scout"
    />
  )
}
