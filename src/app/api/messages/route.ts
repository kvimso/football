import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendMessageSchema, loadMessagesSchema } from '@/lib/validations'
import { CHAT_LIMITS } from '@/lib/constants'

// POST: Send a message
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Validate input
  const body = await request.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' },
      { status: 400 }
    )
  }

  const { conversation_id, content, message_type, file_url, file_name, file_type, file_size_bytes, referenced_player_id } = parsed.data

  // Verify user is a participant (RLS will also check, but we want a nice error)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, scout_id, club_id')
    .eq('id', conversation_id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'errors.conversationNotFound' }, { status: 404 })
  }

  // Block check — neither party can send when conversation is blocked
  const { data: blocks } = await supabase
    .from('conversation_blocks')
    .select('blocked_by')
    .eq('conversation_id', conversation_id)

  if (blocks && blocks.length > 0) {
    return NextResponse.json({ error: 'errors.conversationBlocked' }, { status: 403 })
  }

  // Rate limit: max 30 messages per user per conversation per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('conversation_id', conversation_id)
    .gte('created_at', oneHourAgo)

  if (recentCount !== null && recentCount >= CHAT_LIMITS.MAX_MESSAGES_PER_HOUR) {
    return NextResponse.json({ error: 'errors.rateLimitMessages' }, { status: 429 })
  }

  // Insert message
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      content: content ?? null,
      message_type,
      file_url: file_url ?? null,
      file_name: file_name ?? null,
      file_type: file_type ?? null,
      file_size_bytes: file_size_bytes ?? null,
      referenced_player_id: referenced_player_id ?? null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[messages/POST] Insert error:', insertError.message)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ message }, { status: 201 })
}

// GET: Load messages for a conversation (cursor-based pagination)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const parsed = loadMessagesSchema.safeParse({
    conversation_id: searchParams.get('conversation_id'),
    before: searchParams.get('before') || undefined,
    limit: searchParams.get('limit') || 50,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  const { conversation_id, before, limit } = parsed.data

  // Verify participation (RLS also checks, but we want a nice 404)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversation_id)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'errors.conversationNotFound' }, { status: 404 })
  }

  // Build query — include player ref data via JOIN
  let query = supabase
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
    .eq('conversation_id', conversation_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit + 1) // fetch one extra to determine has_more

  // Cursor-based pagination: fetch messages older than the cursor
  if (before) {
    const { data: cursorMsg } = await supabase
      .from('messages')
      .select('created_at')
      .eq('id', before)
      .single()

    if (cursorMsg) {
      query = query.lt('created_at', cursorMsg.created_at)
    }
  }

  const { data: messages, error: msgError } = await query

  if (msgError) {
    console.error('[messages/GET] Fetch error:', msgError.message)
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  const hasMore = (messages?.length ?? 0) > limit
  const trimmed = messages?.slice(0, limit) ?? []

  // Generate signed URLs for file messages that store a storage path
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

  return NextResponse.json({
    messages: enriched,
    has_more: hasMore,
  })
}
