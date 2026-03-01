import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { fetchConversations } from '@/lib/chat-queries'

export default async function ScoutMessagesPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { conversations, error } = await fetchConversations(supabase, user.id, 'scout')

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t('chat.messages')}</h1>
      <p className="mt-1 text-sm text-foreground-muted">{t('dashboard.messagesDesc')}</p>
      <div className="mt-6">
        <ChatInbox
          conversations={conversations}
          userId={user.id}
          userRole="scout"
          basePath="/dashboard/messages"
          error={error}
        />
      </div>
    </div>
  )
}
