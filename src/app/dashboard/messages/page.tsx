import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatEmptyState } from '@/components/chat/ChatEmptyState'
import { fetchConversations } from '@/lib/chat-queries'

export default async function ScoutMessagesPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { conversations, error } = await fetchConversations(supabase, user.id, 'scout')

  return (
    <>
      {/* Mobile: full conversation list (sidebar is hidden below lg) */}
      <div className="lg:hidden overflow-y-auto p-4">
        <h1 className="text-2xl font-bold text-foreground">{t('chat.messages')}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('dashboard.messagesDesc')}</p>
        <div className="mt-4">
          <ChatInbox
            conversations={conversations}
            userId={user.id}
            userRole="scout"
            basePath="/dashboard/messages"
            error={error}
          />
        </div>
      </div>

      {/* Desktop: empty state placeholder (sidebar in layout handles the list) */}
      <div className="hidden lg:flex h-full">
        <ChatEmptyState />
      </div>
    </>
  )
}
