import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatMessagesLayout } from '@/components/chat/ChatMessagesLayout'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { conversations, error } = await getCachedConversations(user.id, 'scout')

  return (
    <ChatMessagesLayout
      initialConversations={conversations}
      userId={user.id}
      userRole="scout"
      basePath="/dashboard/messages"
      error={error}
    >
      {children}
    </ChatMessagesLayout>
  )
}
