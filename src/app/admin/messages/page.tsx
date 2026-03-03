import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/server-translations'
import { getCachedConversations } from '@/lib/chat-queries'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatEmptyState } from '@/components/chat/ChatEmptyState'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { t } = await getServerT()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('club_id')
    .eq('id', user.id)
    .single()

  if (!profile?.club_id) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-foreground-muted">
        <p>{t('admin.noClub')}</p>
      </div>
    )
  }

  // Deduplicated with layout via React.cache — only 1 RPC per request
  const { conversations, error } = await getCachedConversations(user.id, 'academy_admin')

  return (
    <>
      {/* Mobile: full conversation list (sidebar is hidden below lg) */}
      <div className="lg:hidden overflow-y-auto p-4">
        <h1 className="text-2xl font-bold text-foreground">{t('chat.messages')}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('dashboard.messagesDesc')}</p>
        <div className="mt-4">
          <ChatInbox
            initialConversations={conversations}
            userId={user.id}
            userRole="academy_admin"
            basePath="/admin/messages"
            error={error}
          />
        </div>
      </div>

      {/* Desktop: empty state placeholder (sidebar in layout handles the list) */}
      <div className="hidden lg:flex flex-1">
        <ChatEmptyState userRole="academy_admin" />
      </div>
    </>
  )
}
