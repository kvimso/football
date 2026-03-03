import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/cached-auth'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatMessagesLayout } from '@/components/chat/ChatMessagesLayout'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getCachedUser()
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
