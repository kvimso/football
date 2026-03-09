import { redirect } from 'next/navigation'
import { getCachedUser, getCachedAdminProfile } from '@/lib/cached-auth'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatMessagesLayout } from '@/components/chat/ChatMessagesLayout'

export default async function AdminMessagesLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCachedUser()
  if (!user) redirect('/login')

  const profile = await getCachedAdminProfile(user.id)

  if (!profile?.club_id) {
    // No club assigned — render children directly (page will show error state)
    return <>{children}</>
  }

  const { conversations, error } = await getCachedConversations(user.id, 'academy_admin')

  return (
    <ChatMessagesLayout
      initialConversations={conversations}
      userId={user.id}
      userRole="academy_admin"
      basePath="/admin/messages"
      error={error}
    >
      {children}
    </ChatMessagesLayout>
  )
}
