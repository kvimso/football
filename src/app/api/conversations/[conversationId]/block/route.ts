import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { uuidSchema } from '@/lib/validations'

const blockActionSchema = z.object({
  action: z.enum(['block', 'unblock']),
})

interface RouteContext {
  params: Promise<{ conversationId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { conversationId } = await context.params
  const supabase = await createClient()

  // Validate conversationId is a UUID
  if (!uuidSchema.safeParse(conversationId).success) {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Role check — academy_admin only
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }
  if (profile.role !== 'academy_admin') {
    return NextResponse.json({ error: 'errors.unauthorized' }, { status: 403 })
  }

  // Validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  const parsed = blockActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  const { action } = parsed.data

  // Verify conversation exists and user's club_id matches
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, club_id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'errors.conversationNotFound' }, { status: 404 })
  }

  if (conversation.club_id !== profile.club_id) {
    return NextResponse.json({ error: 'errors.unauthorized' }, { status: 403 })
  }

  if (action === 'block') {
    // Check if already blocked
    const { data: existing } = await supabase
      .from('conversation_blocks')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('blocked_by', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'errors.alreadyBlocked' }, { status: 400 })
    }

    // Insert block
    const { error: insertError } = await supabase
      .from('conversation_blocks')
      .insert({
        conversation_id: conversationId,
        blocked_by: user.id,
      })

    if (insertError) {
      console.error('[block/POST] Insert error:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, is_blocked: true })
  } else {
    // Unblock — delete the block record
    const { data: deleted, error: deleteError } = await supabase
      .from('conversation_blocks')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('blocked_by', user.id)
      .select('id')

    if (deleteError) {
      console.error('[block/POST] Delete error:', deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'errors.notBlocked' }, { status: 400 })
    }

    return NextResponse.json({ success: true, is_blocked: false })
  }
}
