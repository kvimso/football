import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createConversationSchema } from '@/lib/validations'
import { CHAT_LIMITS } from '@/lib/constants'
import { fetchConversations } from '@/lib/chat-queries'

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
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

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

// GET: List user's conversations with metadata (delegates to shared query)
export async function GET() {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Get user profile for role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  const role = profile.role as 'scout' | 'academy_admin'
  const { conversations, error } = await fetchConversations(supabase, user.id, role)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ conversations })
}
