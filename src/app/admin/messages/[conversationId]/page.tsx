import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchConversationById, fetchInitialMessages } from '@/lib/chat-queries'
import { ChatThread } from '@/components/chat/ChatThread'

export default async function AdminConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify academy_admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'academy_admin' || !profile.club_id) {
    redirect('/login')
  }

  const conversation = await fetchConversationById(supabase, conversationId, user.id, 'academy_admin')
  if (!conversation) notFound()

  const { messages, has_more } = await fetchInitialMessages(supabase, conversationId)

  return (
    <ChatThread
      conversation={conversation}
      initialMessages={messages}
      hasMoreInitial={has_more}
      userId={user.id}
      userRole="academy_admin"
    />
  )
}
