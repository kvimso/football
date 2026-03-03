'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { useConversationList } from '@/hooks/useConversationList'
import { formatMessageTime, getLastMessagePreview } from '@/lib/chat-utils'
import type { ConversationItem } from '@/lib/types'

interface ChatSidebarProps {
  initialConversations: ConversationItem[]
  userId: string
  userRole: 'scout' | 'academy_admin'
  basePath: string
  error?: string | null
}

export function ChatSidebar({ initialConversations, userId, userRole, basePath, error }: ChatSidebarProps) {
  const { t, lang } = useLang()
  const pathname = usePathname()
  const { conversations } = useConversationList({ initialConversations, userId })

  // Extract active conversation ID from URL
  const activeConversationId = pathname.startsWith(basePath + '/')
    ? pathname.slice(basePath.length + 1).split('/')[0]
    : null

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <svg className="h-10 w-10 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <p className="mt-2 text-xs text-foreground-muted">{error}</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <svg className="h-10 w-10 text-foreground-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        <p className="mt-2 text-xs text-foreground-muted">{t('chat.noConversations')}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t('chat.conversations')}</h2>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto overscroll-contain" role="list" aria-label={t('chat.conversationList')}>
        {conversations.map((conv) => {
          const isActive = conv.id === activeConversationId
          const rawName = userRole === 'scout'
            ? (lang === 'ka' && conv.club?.name_ka ? conv.club.name_ka : conv.club?.name ?? conv.other_party.full_name)
            : conv.other_party.full_name
          const displayName = rawName || (userRole === 'scout' ? t('common.unknownClub') : t('common.unknownScout'))

          const lastMessagePreview = getLastMessagePreview(conv, userId, t)
          const timestamp = conv.last_message?.created_at
            ? formatMessageTime(conv.last_message.created_at, lang, t)
            : formatMessageTime(conv.created_at, lang, t)

          return (
            <Link
              key={conv.id}
              href={`${basePath}/${conv.id}`}
              role="listitem"
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 border-l-2 px-3 py-3 transition-colors hover:bg-card-hover ${
                isActive
                  ? 'border-l-accent bg-accent/5'
                  : 'border-l-transparent'
              } ${conv.is_blocked ? 'opacity-60' : ''}`}
            >
              {/* Avatar */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                {userRole === 'scout' && conv.club?.logo_url ? (
                  <Image
                    src={conv.club.logo_url}
                    alt={conv.club.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-accent">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm ${conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                    {displayName}
                  </span>
                  <span className={`shrink-0 text-[10px] ${conv.unread_count > 0 ? 'font-semibold text-accent' : 'text-foreground-muted'}`}>
                    {timestamp}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className={`truncate text-xs ${conv.unread_count > 0 ? 'font-medium text-foreground-muted' : 'text-foreground-muted/60'}`}>
                    {lastMessagePreview}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                      {conv.unread_count > 99 ? '99+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
