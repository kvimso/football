'use client'

import { useConversationList } from '@/hooks/useConversationList'
import { ConversationListContext } from '@/context/ConversationListContext'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { MobileChatDrawer } from '@/components/chat/MobileChatDrawer'
import { ChatDrawerProvider } from '@/context/ChatDrawerContext'
import type { ConversationItem } from '@/lib/types'

interface ChatMessagesLayoutProps {
  initialConversations: ConversationItem[]
  userId: string
  userRole: 'scout' | 'academy_admin'
  basePath: string
  error?: string | null
  children: React.ReactNode
}

export function ChatMessagesLayout({
  initialConversations,
  userId,
  userRole,
  basePath,
  error,
  children,
}: ChatMessagesLayoutProps) {
  const { conversations } = useConversationList({ initialConversations, userId })

  return (
    <ConversationListContext.Provider value={conversations}>
      <ChatDrawerProvider>
        {/* Split-pane container: sidebar + thread.
            h-full fills the calc'd height set by the parent layout. */}
        <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-surface/30">
          <nav
            aria-label="Conversation list"
            className="hidden lg:flex w-80 shrink-0 flex-col border-r border-border/60 bg-surface/40"
          >
            <ChatSidebar userRole={userRole} basePath={basePath} userId={userId} error={error} />
          </nav>

          <MobileChatDrawer>
            <ChatSidebar userRole={userRole} basePath={basePath} userId={userId} error={error} />
          </MobileChatDrawer>

          <div role="region" aria-label="Message thread" className="flex-1 min-w-0 flex flex-col">
            {children}
          </div>
        </div>
      </ChatDrawerProvider>
    </ConversationListContext.Provider>
  )
}
