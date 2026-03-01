import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConversationSchema } from '@/lib/validations'
import { CHAT_LIMITS } from '@/lib/constants'

// POST: Create or get existing conversation (scout only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Role check — only scouts can initiate
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }
  if (profile.role !== 'scout') {
    return NextResponse.json({ error: 'errors.unauthorized' }, { status: 403 })
  }

  // Validate input
  const body = await request.json()
  const parsed = createConversationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  const { club_id } = parsed.data

  // Verify club exists
  const { data: club, error: clubError } = await supabase
    .from('clubs')
    .select('id')
    .eq('id', club_id)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: 'errors.clubNotFound' }, { status: 404 })
  }

  // Check for existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('scout_id', user.id)
    .eq('club_id', club_id)
    .single()

  if (existing) {
    return NextResponse.json({ conversation: { id: existing.id } })
  }

  // Rate limit: max 10 new conversations per scout per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('scout_id', user.id)
    .gte('created_at', oneDayAgo)

  if (recentCount !== null && recentCount >= CHAT_LIMITS.MAX_CONVERSATIONS_PER_DAY) {
    return NextResponse.json({ error: 'errors.rateLimitConversations' }, { status: 429 })
  }

  // Create conversation
  const { data: conversation, error: insertError } = await supabase
    .from('conversations')
    .insert({ scout_id: user.id, club_id })
    .select('id')
    .single()

  if (insertError) {
    console.error('[conversations/POST] Insert error:', insertError.message)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Insert system message (non-critical — don't fail if this errors)
  try {
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: 'chat.conversationStarted',
      message_type: 'system',
    })
  } catch (err) {
    console.error('[conversations/POST] System message error:', err)
  }

  return NextResponse.json({ conversation: { id: conversation.id } }, { status: 201 })
}

// GET: List user's conversations with metadata
export async function GET() {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Get user profile for role-based query
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Fetch conversations (RLS filters to user's own)
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id, scout_id, club_id, last_message_at, created_at,
      club:clubs!conversations_club_id_fkey ( id, name, name_ka, logo_url ),
      scout:profiles!conversations_scout_id_fkey ( id, full_name, email, organization, role )
    `)
    .order('last_message_at', { ascending: false })

  if (convError) {
    console.error('[conversations/GET] Fetch error:', convError.message)
    return NextResponse.json({ error: convError.message }, { status: 500 })
  }

  // For each conversation, get last message and unread count
  const conversationsWithMeta = await Promise.all(
    (conversations ?? []).map(async (conv) => {
      // Last message
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('content, message_type, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      const lastMessage = lastMessages?.[0] ?? null

      // Unread count (messages not sent by me, not yet read)
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .is('deleted_at', null)

      // Block status
      const { data: blocks } = await supabase
        .from('conversation_blocks')
        .select('blocked_by')
        .eq('conversation_id', conv.id)
        .limit(1)

      const isBlocked = (blocks?.length ?? 0) > 0

      // Determine "other party" based on user role
      const club = Array.isArray(conv.club) ? conv.club[0] : conv.club
      const scout = Array.isArray(conv.scout) ? conv.scout[0] : conv.scout

      const otherParty = profile.role === 'scout'
        ? { id: club?.id ?? '', full_name: club?.name ?? '', organization: null, role: 'academy_admin' }
        : { id: scout?.id ?? '', full_name: scout?.full_name ?? '', organization: scout?.organization ?? null, role: 'scout' }

      return {
        id: conv.id,
        club: club ? { id: club.id, name: club.name, name_ka: club.name_ka, logo_url: club.logo_url } : null,
        other_party: otherParty,
        last_message: lastMessage,
        unread_count: unreadCount ?? 0,
        is_blocked: isBlocked,
        created_at: conv.created_at,
      }
    })
  )

  return NextResponse.json({ conversations: conversationsWithMeta })
}
