'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/hooks/useLang'
import { groupMessagesByDate, isSameTimeGroup } from '@/lib/chat-utils'
import { realtimeMessageSchema } from '@/lib/validations'
import { DateDivider } from '@/components/chat/DateDivider'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import type { ConversationDetail, MessageWithSender, MessageType, UserRole } from '@/lib/types'

interface ChatThreadProps {
  conversation: ConversationDetail
  initialMessages: MessageWithSender[]
  hasMoreInitial: boolean
  userId: string
  userRole: 'scout' | 'academy_admin'
}

export function ChatThread({
  conversation,
  initialMessages,
  hasMoreInitial,
  userId,
  userRole,
}: ChatThreadProps) {
  const { t, lang } = useLang()
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages)
  const [hasMore, setHasMore] = useState(hasMoreInitial)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected')
  const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(conversation.is_blocked)
  const [blockedByMe, setBlockedByMe] = useState(conversation.blocked_by_me)
  const [blockConfirming, setBlockConfirming] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const initialMessageIdsRef = useRef<Set<string>>(new Set(initialMessages.map(m => m.id)))
  const firstUnreadIdRef = useRef<string | null>(
    initialMessages.find(m => m.sender_id !== userId && !m.read_at)?.id ?? null
  )

  const backPath = userRole === 'scout' ? '/dashboard/messages' : '/admin/messages'
  const displayName = lang === 'ka' && conversation.club.name_ka
    ? conversation.club.name_ka
    : (userRole === 'scout' ? conversation.club.name : conversation.other_party.full_name)

  // Block/unblock handler
  const handleBlockAction = useCallback(async () => {
    if (blockedByMe && !blockConfirming) {
      // Unblock — no confirmation needed
      setBlockLoading(true)
      try {
        const res = await fetch(`/api/conversations/${conversation.id}/block`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unblock' }),
        })
        if (res.ok) {
          setIsBlocked(false)
          setBlockedByMe(false)
        }
      } finally {
        setBlockLoading(false)
      }
      return
    }

    if (!blockConfirming) {
      // First click — show confirmation
      setBlockConfirming(true)
      return
    }

    // Second click — confirm block
    setBlockLoading(true)
    setBlockConfirming(false)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block' }),
      })
      if (res.ok) {
        setIsBlocked(true)
        setBlockedByMe(true)
      }
    } finally {
      setBlockLoading(false)
    }
  }, [conversation.id, blockedByMe, blockConfirming])

  // Cancel block confirmation on click outside (after a timeout)
  useEffect(() => {
    if (!blockConfirming) return
    const timer = setTimeout(() => setBlockConfirming(false), 3000)
    return () => clearTimeout(timer)
  }, [blockConfirming])

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
    setNewMessageCount(0)
  }, [])

  // Scroll to bottom on initial mount
  useEffect(() => {
    scrollToBottom('instant')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const threshold = 150
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    if (isAtBottomRef.current && newMessageCount > 0) {
      setNewMessageCount(0)
    }
  }, [newMessageCount])

  // Mark messages as read
  useEffect(() => {
    const markRead = async () => {
      if (document.visibilityState !== 'visible') return
      await fetch(`/api/messages/${conversation.id}/read`, { method: 'PATCH' })
    }

    markRead()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') markRead()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [conversation.id])

  // Realtime subscription — deferred to survive React StrictMode double-mount
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    // Defer subscription so StrictMode's synchronous cleanup cancels before it runs
    const timer = setTimeout(() => {
      if (cancelled) return

      const channel = supabase
        .channel(`thread-${conversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        }, (payload) => {
          // Validate Realtime payload with Zod
          const result = realtimeMessageSchema.safeParse(payload.new)
          if (!result.success) {
            console.warn('Malformed realtime message:', result.error)
            return
          }
          const newMsg = result.data

          // Don't add if it's our own optimistic message (already in state)
          setMessages(prev => {
            // Check if already exists (by real ID)
            if (prev.some(m => m.id === newMsg.id)) return prev

            // Check if this is our own message that we sent optimistically
            if (newMsg.sender_id === userId) {
              // Replace temp message with real one if exists
              const tempIdx = prev.findIndex(m =>
                m.id.startsWith('temp-') &&
                m.sender_id === userId &&
                Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 5000
              )
              if (tempIdx !== -1) {
                const updated = [...prev]
                updated[tempIdx] = {
                  ...updated[tempIdx],
                  id: newMsg.id,
                  _status: 'sent',
                }
                return updated
              }
            }

            // New message from other party
            const realtimeMsg: MessageWithSender = {
              id: newMsg.id,
              conversation_id: newMsg.conversation_id,
              sender_id: newMsg.sender_id,
              content: newMsg.content,
              message_type: newMsg.message_type as MessageType,
              file_url: newMsg.file_url,
              file_name: newMsg.file_name,
              file_type: newMsg.file_type,
              file_size_bytes: newMsg.file_size_bytes,
              referenced_player_id: newMsg.referenced_player_id,
              read_at: newMsg.read_at,
              created_at: newMsg.created_at,
              sender: null, // Will be populated on next load
              referenced_player: null,
            }

            // Announce to screen readers (incoming messages only)
            if (realtimeMsg.sender_id !== userId) {
              const content = realtimeMsg.content?.slice(0, 100) ?? ''
              setLastAnnouncement(content)
            }

            if (isAtBottomRef.current) {
              setTimeout(() => scrollToBottom(), 50)
            } else {
              setNewMessageCount(c => c + 1)
            }

            return [...prev, realtimeMsg]
          })

          // Mark as read if visible
          if (document.visibilityState === 'visible' && newMsg.sender_id !== userId) {
            fetch(`/api/messages/${conversation.id}/read`, { method: 'PATCH' })
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        }, (payload) => {
          const updated = payload.new as Record<string, unknown>
          setMessages(prev => prev.map(m =>
            m.id === updated.id ? { ...m, read_at: updated.read_at as string | null } : m
          ))
        })
        .subscribe((status) => {
          if (cancelled) return
          if (status === 'SUBSCRIBED') setConnectionStatus('connected')
          else if (status === 'CHANNEL_ERROR') setConnectionStatus('reconnecting')
          else if (status === 'TIMED_OUT') setConnectionStatus('disconnected')
          else if (status === 'CLOSED') setConnectionStatus('disconnected')
        })

      channelRef.current = channel
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversation.id, userId, scrollToBottom])

  // Load older messages
  const loadOlder = useCallback(async () => {
    const oldestId = messages[0]?.id
    if (!oldestId || !hasMore || isLoadingMore || oldestId.startsWith('temp-')) return
    setIsLoadingMore(true)

    try {
      const res = await fetch(`/api/messages?conversation_id=${conversation.id}&before=${oldestId}`)
      if (!res.ok) return

      const data = await res.json()
      const el = scrollContainerRef.current
      const prevHeight = el?.scrollHeight ?? 0

      const normalized: MessageWithSender[] = (data.messages as MessageWithSender[]).reverse()
      setMessages(prev => [...normalized, ...prev])
      setHasMore(data.has_more)

      // Restore scroll position
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight
      })
    } finally {
      setIsLoadingMore(false)
    }
  }, [messages, hasMore, isLoadingMore, conversation.id])

  // Unified send message helper (optimistic update + POST)
  const sendMessage = useCallback(async (
    type: MessageType,
    payload: {
      content?: string
      file_url?: string
      file_name?: string
      file_type?: string
      file_size_bytes?: number
      referenced_player_id?: string
    }
  ) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: MessageWithSender = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: userId,
      content: payload.content ?? null,
      message_type: type,
      file_url: payload.file_url ?? null,
      file_name: payload.file_name ?? null,
      file_type: payload.file_type ?? null,
      file_size_bytes: payload.file_size_bytes ?? null,
      referenced_player_id: payload.referenced_player_id ?? null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: { id: userId, full_name: t('chat.you'), role: userRole as UserRole },
      referenced_player: null,
      _status: 'sending',
    }

    setMessages(prev => [...prev, optimistic])
    scrollToBottom()

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          message_type: type,
          content: payload.content,
          file_url: payload.file_url,
          file_name: payload.file_name,
          file_type: payload.file_type,
          file_size_bytes: payload.file_size_bytes,
          referenced_player_id: payload.referenced_player_id,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, _status: 'failed' as const, _error: err.error } : m
        ))
        return
      }

      const { message } = await res.json()
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, id: message.id, _status: 'sent' as const } : m
      ))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, _status: 'failed' as const } : m
      ))
    }
  }, [conversation.id, userId, userRole, scrollToBottom, t])

  const sendTextMessage = useCallback(async (content: string) => {
    await sendMessage('text', { content })
  }, [sendMessage])

  const sendFileMessage = useCallback(async (data: { storage_path: string; file_name: string; file_type: string; file_size_bytes: number }) => {
    await sendMessage('file', {
      file_url: data.storage_path,
      file_name: data.file_name,
      file_type: data.file_type,
      file_size_bytes: data.file_size_bytes,
    })
  }, [sendMessage])

  const sendPlayerRefMessage = useCallback(async (playerId: string) => {
    await sendMessage('player_ref', { referenced_player_id: playerId })
  }, [sendMessage])

  // Retry failed message
  const retryMessage = useCallback(async (failedMsg: MessageWithSender) => {
    // Remove the failed message and resend
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id))

    if (failedMsg.message_type === 'text' && failedMsg.content) {
      await sendTextMessage(failedMsg.content)
    }
  }, [sendTextMessage])

  // Group messages by date
  const dateGroups = groupMessagesByDate(messages)

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col">
      {/* Thread Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link
          href={backPath}
          aria-label={t('aria.goBack')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>

        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
            {userRole === 'scout' && conversation.club.logo_url ? (
              <Image
                src={conversation.club.logo_url}
                alt={displayName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-accent">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{displayName}</h2>
            {isBlocked && (
              <span className="text-xs text-red-400">{t('chat.blocked')}</span>
            )}
          </div>
        </div>

        {userRole === 'academy_admin' && (
          <button
            onClick={handleBlockAction}
            disabled={blockLoading}
            aria-label={isBlocked && blockedByMe ? t('aria.unblockScout') : t('aria.blockScout')}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              blockConfirming
                ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : isBlocked && blockedByMe
                  ? 'border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                  : 'border-border text-foreground-muted hover:text-foreground hover:bg-background-secondary'
            }`}
          >
            {blockLoading ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-foreground-muted border-t-transparent inline-block" />
            ) : blockConfirming ? (
              t('chat.confirmBlock')
            ) : isBlocked && blockedByMe ? (
              t('chat.unblock')
            ) : (
              t('chat.block')
            )}
          </button>
        )}
      </div>

      {/* Connection status banner */}
      {connectionStatus !== 'connected' && (
        <div className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium animate-slide-in-down ${
          connectionStatus === 'reconnecting'
            ? 'bg-yellow-500/10 text-yellow-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          <span className="h-2 w-2 rounded-full animate-pulse bg-current" />
          {connectionStatus === 'reconnecting' ? t('chat.reconnecting') : t('chat.connectionLost')}
        </div>
      )}

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {/* Load older */}
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={loadOlder}
              disabled={isLoadingMore}
              aria-label={t('aria.loadOlder')}
              className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-background-secondary disabled:opacity-50"
            >
              {isLoadingMore ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border border-foreground-muted border-t-transparent" />
                  {t('common.loading')}
                </span>
              ) : (
                t('chat.loadOlder')
              )}
            </button>
          </div>
        )}

        {/* Messages grouped by date */}
        <div className="space-y-1">
          {dateGroups.map((group) => (
            <div key={group.date}>
              <DateDivider date={group.messages[0].created_at} lang={lang} t={t} />
              {group.messages.map((msg, idx) => {
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                const isMine = msg.sender_id === userId
                const showSenderName = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id)
                const showTimestamp = !prevMsg ||
                  prevMsg.sender_id !== msg.sender_id ||
                  !isSameTimeGroup(prevMsg.created_at, msg.created_at)
                const isNew = !initialMessageIdsRef.current.has(msg.id)

                return (
                  <div key={msg.id}>
                    {/* Unread separator */}
                    {msg.id === firstUnreadIdRef.current && (
                      <div className="flex items-center gap-3 px-4 py-2 animate-slide-in-down">
                        <div className="h-px flex-1 bg-accent/50" />
                        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-accent">
                          {t('chat.newMessages')}
                        </span>
                        <div className="h-px flex-1 bg-accent/50" />
                      </div>
                    )}
                    <MessageBubble
                      message={msg}
                      isMine={isMine}
                      showSenderName={showSenderName}
                      showTimestamp={showTimestamp}
                      lang={lang}
                      t={t}
                      onRetry={msg._status === 'failed' ? () => retryMessage(msg) : undefined}
                      isNew={isNew}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* New messages indicator */}
      {newMessageCount > 0 && (
        <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={() => scrollToBottom()}
            aria-label={t('aria.scrollToLatest')}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105"
          >
            {newMessageCount} {t('chat.newMessages')}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        conversationId={conversation.id}
        onSendText={sendTextMessage}
        onSendFile={sendFileMessage}
        onSendPlayerRef={sendPlayerRefMessage}
        isBlocked={isBlocked}
        blockedByMe={blockedByMe}
        lang={lang}
        t={t}
      />

      {/* Screen reader announcement for new messages */}
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {lastAnnouncement}
      </div>
    </div>
  )
}
