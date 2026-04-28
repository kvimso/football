import { redirect } from 'next/navigation'
import { getCachedUser } from '@/lib/cached-auth'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { ChatEmptyState } from '@/components/chat/ChatEmptyState'

export default async function ScoutMessagesPage() {
  const { user } = await getCachedUser()
  if (!user) redirect('/login')

  return (
    <>
      {/* Mobile: full conversation list (sidebar is hidden below lg) */}
      <div className="lg:hidden overflow-y-auto px-1 py-2">
        <header className="px-3 pb-4 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            Messages
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-foreground">Inbox</h1>
        </header>
        <div className="px-1">
          <ChatInbox userRole="scout" basePath="/messages" userId={user.id} />
        </div>
      </div>

      {/* Desktop: empty state placeholder (sidebar in layout handles the list) */}
      <div className="hidden lg:flex flex-1">
        <ChatEmptyState userRole="scout" />
      </div>
    </>
  )
}
