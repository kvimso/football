'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConversationItem } from '@/lib/types'

interface UseConversationListOptions {
  initialConversations: ConversationItem[]
  userId: string
}

/**
 * Shared hook for realtime conversation list updates.
 * Used by ChatSidebar and ChatInbox to maintain a live conversation list
 * with debounced refetching on Supabase Realtime events.
 */
export function useConversationList({ initialConversations, userId }: UseConversationListOptions) {
  const [conversations, setConversations] = useState(initialConversations)

  // Sync with server-side props when they change
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  // Track current conversation IDs for subscription filter (avoids re-subscribing)
  const conversationIdsRef = useRef<string[]>(initialConversations.map(c => c.id))
  useEffect(() => {
    conversationIdsRef.current = conversations.map(c => c.id)
  }, [conversations])

  // Realtime subscription — deferred to survive React StrictMode double-mount
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    let debounceTimer: NodeJS.Timeout
    let activeChannel: ReturnType<typeof supabase.channel> | null = null

    const refetchConversations = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        if (cancelled) return
        try {
          const res = await fetch('/api/conversations')
          if (res.ok) {
            const data = (await res.json()) as { conversations: ConversationItem[] }
            setConversations(data.conversations)
          }
        } catch {
          // Silently fail — stale data persists until next event
        }
      }, 1500)
    }

    const timer = setTimeout(() => {
      if (cancelled) return
      const ids = conversationIdsRef.current
      const channelBuilder = supabase.channel(`conversations-${userId}`)

      if (ids.length > 0) {
        channelBuilder.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${ids.join(',')})`,
        }, refetchConversations)
      }

      channelBuilder.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
      }, refetchConversations)

      activeChannel = channelBuilder.subscribe()
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(debounceTimer)
      if (activeChannel) supabase.removeChannel(activeChannel)
    }
  }, [userId])

  return { conversations }
}
