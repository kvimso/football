'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ConversationItem } from '@/lib/types'

interface UseConversationListOptions {
  initialConversations: ConversationItem[]
  userId: string
}

/**
 * Shared hook for realtime conversation list updates.
 * Owns a single Supabase Realtime subscription (unfiltered on `messages` table).
 * RLS ensures users only see their own conversations on refetch.
 * Called once in ChatMessagesLayout; consumers read from ConversationListContext.
 */
export function useConversationList({ initialConversations, userId }: UseConversationListOptions) {
  const [conversations, setConversations] = useState(initialConversations)

  // Sync with server-side props when they change
  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

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
      const channelBuilder = supabase.channel(`conversations-${userId}`)

      // Unfiltered — RLS restricts server-side; new conversations are caught too
      channelBuilder.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        refetchConversations
      )

      channelBuilder.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        refetchConversations
      )

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
