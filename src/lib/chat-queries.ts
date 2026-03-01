import type { ConversationItem } from '@/components/chat/ChatInbox'
import type { createClient } from '@/lib/supabase/server'

export interface FetchConversationsResult {
  conversations: ConversationItem[]
  error: string | null
}

/**
 * Fetch conversations with metadata for inbox display.
 * Used by both scout and admin inbox server components.
 */
export async function fetchConversations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: 'scout' | 'academy_admin',
): Promise<FetchConversationsResult> {
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id, scout_id, club_id, last_message_at, created_at,
      club:clubs!conversations_club_id_fkey ( id, name, name_ka, logo_url ),
      scout:profiles!conversations_scout_id_fkey ( id, full_name, email, organization, role )
    `)
    .order('last_message_at', { ascending: false })

  if (error || !conversations) {
    console.error('[chat-queries] Fetch error:', error?.message)
    return { conversations: [], error: error?.message ?? 'Failed to load conversations' }
  }

  const results = await Promise.all(
    conversations.map(async (conv) => {
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('content, message_type, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      const rawMsg = lastMessages?.[0]
      const lastMessage = rawMsg
        ? {
            content: rawMsg.content,
            message_type: rawMsg.message_type,
            created_at: rawMsg.created_at ?? '',
            sender_id: rawMsg.sender_id ?? '',
          }
        : null

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .is('read_at', null)
        .is('deleted_at', null)

      const { data: blocks } = await supabase
        .from('conversation_blocks')
        .select('blocked_by')
        .eq('conversation_id', conv.id)
        .limit(1)

      const club = Array.isArray(conv.club) ? conv.club[0] : conv.club
      const scout = Array.isArray(conv.scout) ? conv.scout[0] : conv.scout

      const otherParty = role === 'scout'
        ? { id: club?.id ?? '', full_name: club?.name ?? '', organization: null, role: 'academy_admin' }
        : { id: scout?.id ?? '', full_name: scout?.full_name ?? '', organization: scout?.organization ?? null, role: 'scout' }

      return {
        id: conv.id,
        club: club ? { id: club.id, name: club.name, name_ka: club.name_ka ?? '', logo_url: club.logo_url } : null,
        other_party: otherParty,
        last_message: lastMessage,
        unread_count: unreadCount ?? 0,
        is_blocked: (blocks?.length ?? 0) > 0,
        created_at: conv.created_at ?? '',
      } satisfies ConversationItem
    })
  )

  return { conversations: results, error: null }
}
