import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/cached-auth'
import { getServerT } from '@/lib/server-translations'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatEmptyState } from '@/components/chat/ChatEmptyState'

export default async function ScoutMessagesPage() {
  const { t } = await getServerT()

  const { user } = await getCachedUser()
  if (!user) redirect('/login')

  return (
    <>
      {/* Mobile: full conversation list (sidebar is hidden below lg) */}
      <div className="lg:hidden overflow-y-auto p-4">
        <h1 className="text-2xl font-bold text-foreground">{t('chat.messages')}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('dashboard.messagesDesc')}</p>
        <div className="mt-4">
          <ChatInbox
            userRole="scout"
            basePath="/dashboard/messages"
            userId={user.id}
          />
        </div>
      </div>

      {/* Desktop: empty state placeholder (sidebar in layout handles the list) */}
      <div className="hidden lg:flex flex-1">
        <ChatEmptyState userRole="scout" />
      </div>
    </>
  )
}
