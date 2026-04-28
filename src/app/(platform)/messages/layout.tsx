import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/cached-auth'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatMessagesLayout } from '@/components/chat/ChatMessagesLayout'

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCachedUser()
  if (!user) redirect('/login')

  const { conversations, error } = await getCachedConversations(user.id, 'scout')

  return (
    <div className="mx-auto h-[calc(100dvh-var(--navbar-height))] max-w-6xl px-3 py-3 sm:px-4 sm:py-4">
      <ChatMessagesLayout
        initialConversations={conversations}
        userId={user.id}
        userRole="scout"
        basePath="/messages"
        error={error}
      >
        {children}
      </ChatMessagesLayout>
    </div>
  )
}
