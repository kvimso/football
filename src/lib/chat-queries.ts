import type { createClient } from '@/lib/supabase/server'
import type { ConversationItem, ConversationDetail, MessageWithSender, UserRole } from '@/lib/types'

export interface FetchConversationsResult {
  conversations: ConversationItem[]
  error: string | null
}

/**
 * Fetch conversations with metadata for inbox display.
 * Uses get_conversations_with_metadata RPC for a single query instead of N+1.
 * Used by both scout and admin inbox server components AND the API route.
 */
export async function fetchConversations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: 'scout' | 'academy_admin',
): Promise<FetchConversationsResult> {
  const { data, error } = await supabase.rpc('get_conversations_with_metadata', {
    p_user_id: userId,
  })

  if (error || !data) {
    console.error('[chat-queries] Fetch error:', error?.message)
    return { conversations: [], error: error?.message ?? 'Failed to load conversations' }
  }

  const conversations: ConversationItem[] = data.map((row) => {
    const otherParty = role === 'scout'
      ? { id: row.club_id, full_name: row.club_name ?? '', organization: null, role: 'academy_admin' as const }
      : { id: row.scout_id, full_name: row.scout_full_name ?? '', organization: row.scout_organization ?? null, role: 'scout' as const }

    const lastMessage = row.last_message_content !== null || row.last_message_type !== null
      ? {
          content: row.last_message_content,
          message_type: row.last_message_type ?? 'text',
          created_at: row.last_message_created_at ?? '',
          sender_id: row.last_message_sender_id ?? '',
        }
      : null

    return {
      id: row.id,
      club: {
        id: row.club_id,
        name: row.club_name ?? '',
        name_ka: row.club_name_ka ?? '',
        logo_url: row.club_logo_url,
      },
      other_party: otherParty,
      last_message: lastMessage,
      unread_count: Number(row.unread_count) || 0,
      is_blocked: row.is_blocked ?? false,
      created_at: row.created_at ?? '',
    }
  })

  return { conversations, error: null }
}

/**
 * Fetch a single conversation with metadata for the thread header.
 */
export async function fetchConversationById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  userId: string,
  role: 'scout' | 'academy_admin',
): Promise<ConversationDetail | null> {
  const { safeParse } = await import('zod').then(m => ({ safeParse: m.z.string().uuid().safeParse }))
  if (!safeParse(conversationId).success) return null

  const { data: conv, error } = await supabase
    .from('conversations')
    .select(`
      id, scout_id, club_id, created_at,
      club:clubs!conversations_club_id_fkey ( id, name, name_ka, logo_url ),
      scout:profiles!conversations_scout_id_fkey ( id, full_name, organization, role )
    `)
    .eq('id', conversationId)
    .single()

  if (error || !conv) return null

  const club = Array.isArray(conv.club) ? conv.club[0] : conv.club
  const scout = Array.isArray(conv.scout) ? conv.scout[0] : conv.scout

  // Verify the user is a participant
  if (role === 'scout' && conv.scout_id !== userId) return null
  if (role === 'academy_admin') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('club_id')
      .eq('id', userId)
      .single()
    if (!profile || profile.club_id !== conv.club_id) return null
  }

  // Check block status
  const { data: blocks } = await supabase
    .from('conversation_blocks')
    .select('blocked_by')
    .eq('conversation_id', conversationId)

  const isBlocked = (blocks?.length ?? 0) > 0
  const blockedByMe = blocks?.some(b => b.blocked_by === userId) ?? false

  const otherParty = role === 'scout'
    ? { id: club?.id ?? '', full_name: club?.name ?? '', organization: null, role: 'academy_admin' as UserRole }
    : { id: scout?.id ?? '', full_name: scout?.full_name ?? '', organization: scout?.organization ?? null, role: 'scout' as UserRole }

  return {
    id: conv.id,
    scout_id: conv.scout_id,
    club_id: conv.club_id,
    club: club ? { id: club.id, name: club.name, name_ka: club.name_ka, logo_url: club.logo_url } : { id: '', name: '', name_ka: null, logo_url: null },
    other_party: otherParty,
    is_blocked: isBlocked,
    blocked_by_me: blockedByMe,
    created_at: conv.created_at ?? '',
  }
}

/**
 * Fetch initial messages for a thread (server-side).
 * Returns messages in ascending order (oldest first).
 */
export async function fetchInitialMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  limit: number = 50,
): Promise<{ messages: MessageWithSender[]; has_more: boolean }> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id, conversation_id, sender_id, content, message_type,
      file_url, file_name, file_type, file_size_bytes,
      referenced_player_id, read_at, created_at,
      sender:profiles!messages_sender_id_fkey ( id, full_name, role ),
      referenced_player:players!messages_referenced_player_id_fkey (
        id, name, name_ka, position, photo_url, slug,
        club:clubs!players_club_id_fkey ( name, name_ka )
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (error || !messages) {
    console.error('[chat-queries] fetchInitialMessages error:', error?.message)
    return { messages: [], has_more: false }
  }

  const hasMore = messages.length > limit
  const trimmed = messages.slice(0, limit)

  // Generate signed URLs for file messages with storage paths
  const enriched = await Promise.all(
    trimmed.map(async (msg) => {
      if (msg.message_type === 'file' && msg.file_url && !msg.file_url.startsWith('http')) {
        const { data } = await supabase.storage
          .from('chat-attachments')
          .createSignedUrl(msg.file_url, 3600)
        return { ...msg, file_url: data?.signedUrl ?? msg.file_url }
      }
      return msg
    })
  )

  // Normalize Supabase JOINs to match MessageWithSender type
  const normalized: MessageWithSender[] = enriched.reverse().map((msg) => {
    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    const refPlayer = Array.isArray(msg.referenced_player) ? msg.referenced_player[0] : msg.referenced_player
    let playerData = null
    if (refPlayer) {
      const club = Array.isArray(refPlayer.club) ? refPlayer.club[0] : refPlayer.club
      playerData = { ...refPlayer, club }
    }
    return {
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      message_type: msg.message_type as MessageWithSender['message_type'],
      file_url: msg.file_url,
      file_name: msg.file_name,
      file_type: msg.file_type,
      file_size_bytes: msg.file_size_bytes,
      referenced_player_id: msg.referenced_player_id,
      read_at: msg.read_at,
      created_at: msg.created_at ?? '',
      sender: sender ? { id: sender.id, full_name: sender.full_name, role: sender.role as UserRole | null } : null,
      referenced_player: playerData,
    }
  })

  return { messages: normalized, has_more: hasMore }
}
