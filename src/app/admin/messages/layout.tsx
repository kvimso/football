import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatMessagesLayout } from '@/components/chat/ChatMessagesLayout'

export default async function AdminMessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

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
