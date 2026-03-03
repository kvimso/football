import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchConversations } from '@/lib/chat-queries'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { MobileChatDrawer } from '@/components/chat/MobileChatDrawer'
import { ChatDrawerProvider } from '@/context/ChatDrawerContext'

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { conversations, error } = await fetchConversations(supabase, user.id, 'scout')

  return (
    <ChatDrawerProvider>
      {/* Split-pane container: sidebar + thread
          Height = 100dvh - 12rem accounts for:
          Navbar (4rem) + py-8 top (2rem) + DashboardNav (~2.5rem) + mt-6 (1.5rem) + bottom padding (2rem) */}
      <div className="flex h-[calc(100dvh-12rem)] -mb-8 overflow-hidden rounded-lg border border-border">
        {/* Desktop sidebar — hidden below lg */}
        <nav aria-label="Conversation list" className="hidden lg:flex w-80 shrink-0 flex-col border-r border-border bg-background">
          <ChatSidebar
            initialConversations={conversations}
            userId={user.id}
            userRole="scout"
            basePath="/dashboard/messages"
            error={error}
          />
        </nav>

        {/* Mobile drawer — hidden at lg+ */}
        <MobileChatDrawer>
          <ChatSidebar
            initialConversations={conversations}
            userId={user.id}
            userRole="scout"
            basePath="/dashboard/messages"
            error={error}
          />
        </MobileChatDrawer>

        {/* Thread pane / empty state */}
        <div role="region" aria-label="Message thread" className="flex-1 min-w-0 flex flex-col">
          {children}
        </div>
      </div>
    </ChatDrawerProvider>
  )
}
