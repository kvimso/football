'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useConversations } from '@/context/ConversationListContext'
import {
  formatMessageTime,
  getLastMessagePreview,
  getConversationDisplayName,
} from '@/lib/chat-utils'
import type { ConversationItem } from '@/lib/types'

interface ChatSidebarProps {
  userRole: 'scout' | 'academy_admin'
  basePath: string
  userId: string
  error?: string | null
}

export function ChatSidebar({ userRole, basePath, userId, error }: ChatSidebarProps) {
  const pathname = usePathname()
  const conversations = useConversations()

  // Extract active conversation ID from URL
  const activeConversationId = pathname.startsWith(basePath + '/')
    ? pathname.slice(basePath.length + 1).split('/')[0]
    : null

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <svg
          className="h-10 w-10 text-danger/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
        <p className="mt-2 text-xs text-foreground-muted">{error}</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <svg
          className="h-10 w-10 text-foreground-muted/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
          />
        </svg>
        <p className="mt-2 text-xs text-foreground-muted">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-5 pt-5 pb-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Conversations</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          {conversations.length} {conversations.length === 1 ? 'thread' : 'threads'}
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-2 pb-3"
        role="list"
        aria-label="Conversation list"
      >
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conv={conv}
            isActive={conv.id === activeConversationId}
            userRole={userRole}
            basePath={basePath}
            userId={userId}
          />
        ))}
      </div>
    </div>
  )
}

interface ConversationListItemProps {
  conv: ConversationItem
  isActive: boolean
  userRole: 'scout' | 'academy_admin'
  basePath: string
  userId: string
}

const ConversationListItem = memo(
  function ConversationListItem({
    conv,
    isActive,
    userRole,
    basePath,
    userId,
  }: ConversationListItemProps) {
    const displayName = getConversationDisplayName(conv.club, conv.other_party, userRole)
    const lastMessagePreview = getLastMessagePreview(conv, userId)
    const timestamp = conv.last_message?.created_at
      ? formatMessageTime(conv.last_message.created_at)
      : formatMessageTime(conv.created_at)

    return (
      <Link
        href={`${basePath}/${conv.id}`}
        role="listitem"
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
          isActive ? 'bg-elevated' : 'hover:bg-elevated/60'
        } ${conv.is_blocked ? 'opacity-60' : ''}`}
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {userRole === 'scout' && conv.club?.logo_url ? (
            <Image
              src={conv.club.logo_url}
              alt={conv.club.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-sm ${conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}
            >
              {displayName}
            </span>
            <span
              className={`shrink-0 text-[11px] ${conv.unread_count > 0 ? 'font-semibold text-primary' : 'text-foreground-muted'}`}
            >
              {timestamp}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={`truncate text-xs ${conv.unread_count > 0 ? 'font-medium text-foreground-muted' : 'text-foreground-muted/60'}`}
            >
              {lastMessagePreview}
            </p>
            {conv.unread_count > 0 && (
              <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-background">
                {conv.unread_count > 99 ? '99+' : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  },
  (prev, next) => {
    return (
      prev.conv.id === next.conv.id &&
      prev.conv.unread_count === next.conv.unread_count &&
      prev.conv.last_message?.created_at === next.conv.last_message?.created_at &&
      prev.conv.is_blocked === next.conv.is_blocked &&
      prev.isActive === next.isActive
    )
  }
)
