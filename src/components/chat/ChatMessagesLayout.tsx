'use client'

import { useLang } from '@/hooks/useLang'
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
  const { t } = useLang()
  const { conversations } = useConversationList({ initialConversations, userId })

  return (
    <ConversationListContext.Provider value={conversations}>
      <ChatDrawerProvider>
        {/* Split-pane container: sidebar + thread
            h-full fills the flex-1 area from parent layout (no magic number needed) */}
        <div className="flex h-full overflow-hidden rounded-lg border border-border">
          {/* Desktop sidebar — hidden below lg */}
          <nav
            aria-label={t('chat.conversationList')}
            className="hidden lg:flex w-80 shrink-0 flex-col border-r border-border bg-background"
          >
            <ChatSidebar userRole={userRole} basePath={basePath} userId={userId} error={error} />
          </nav>

          {/* Mobile drawer — hidden at lg+ */}
          <MobileChatDrawer>
            <ChatSidebar userRole={userRole} basePath={basePath} userId={userId} error={error} />
          </MobileChatDrawer>

          {/* Thread pane / empty state */}
          <div
            role="region"
            aria-label={t('chat.messageThread')}
            className="flex-1 min-w-0 flex flex-col"
          >
            {children}
          </div>
        </div>
      </ChatDrawerProvider>
    </ConversationListContext.Provider>
  )
}
