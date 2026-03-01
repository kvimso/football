'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLang } from '@/hooks/useLang'
import { formatMessageTime, truncateMessage } from '@/lib/chat-utils'
import type { Lang } from '@/lib/translations'

interface ConversationClub {
  id: string
  name: string
  name_ka: string
  logo_url: string | null
}

interface ConversationParty {
  id: string
  full_name: string
  organization: string | null
  role: string
}

interface ConversationLastMessage {
  content: string | null
  message_type: string
  created_at: string
  sender_id: string
}

export interface ConversationItem {
  id: string
  club: ConversationClub | null
  other_party: ConversationParty
  last_message: ConversationLastMessage | null
  unread_count: number
  is_blocked: boolean
  created_at: string
}

interface ChatInboxProps {
  conversations: ConversationItem[]
  userId: string
  userRole: 'scout' | 'academy_admin'
  basePath: string // '/dashboard/messages' or '/admin/messages'
  error?: string | null
}

export function ChatInbox({ conversations, userId, userRole, basePath, error }: ChatInboxProps) {
  const { t, lang } = useLang()
  const router = useRouter()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-16 w-16 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{t('common.somethingWentWrong')}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="btn-primary mt-4 text-sm"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="h-16 w-16 text-foreground-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{t('chat.noConversations')}</h3>
        <p className="mt-1 max-w-sm text-sm text-foreground-muted">
          {userRole === 'scout' ? t('chat.noConversationsHint') : t('chat.noConversationsHintAdmin')}
        </p>
        {userRole === 'scout' && (
          <Link href="/players" className="btn-primary mt-4 text-sm">
            {t('nav.players')}
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => {
        const displayName = userRole === 'scout'
          ? (lang === 'ka' && conv.club?.name_ka ? conv.club.name_ka : conv.club?.name ?? conv.other_party.full_name)
          : conv.other_party.full_name

        const subtitle = userRole === 'scout'
          ? null
          : conv.other_party.organization

        const lastMessagePreview = getLastMessagePreview(conv, userId, t, lang)
        const timestamp = conv.last_message?.created_at
          ? formatMessageTime(conv.last_message.created_at, lang)
          : formatMessageTime(conv.created_at, lang)

        return (
          <Link
            key={conv.id}
            href={`${basePath}/${conv.id}`}
            className={`card flex items-center gap-3 p-4 transition-colors hover:bg-background-secondary ${
              conv.is_blocked ? 'opacity-60' : ''
            }`}
          >
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`truncate text-sm ${conv.unread_count > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground-muted'}`}>
                    {displayName}
                  </span>
                  {conv.is_blocked && (
                    <svg className="h-3.5 w-3.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  )}
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {timestamp}
                </span>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className={`truncate text-xs ${conv.unread_count > 0 ? 'font-medium text-foreground-muted' : 'text-foreground-muted/70'}`}>
                  {subtitle && <span className="text-foreground-muted/50">{subtitle} &middot; </span>}
                  {lastMessagePreview}
                </p>
                {conv.unread_count > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function getLastMessagePreview(
  conv: ConversationItem,
  userId: string,
  t: (key: string) => string,
  lang: Lang,
): string {
  if (!conv.last_message) return ''

  const { content, message_type, sender_id } = conv.last_message
  const isMe = sender_id === userId
  const prefix = isMe ? `${t('chat.you')}: ` : ''

  switch (message_type) {
    case 'file':
      return prefix + t('chat.messagePreviewFile')
    case 'player_ref':
      return prefix + t('chat.messagePreviewPlayerRef')
    case 'system':
      // System messages use translation keys as content
      if (content && content.startsWith('chat.')) {
        return t(content)
      }
      return t('chat.messagePreviewSystem')
    default:
      return prefix + truncateMessage(content ?? '', 60)
  }
}
