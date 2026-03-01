import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH: Mark all unread messages as read in a conversation
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(conversationId)) {
    return NextResponse.json({ error: 'errors.invalidId' }, { status: 400 })
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Verify participation (RLS also checks, but nice error)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'errors.conversationNotFound' }, { status: 404 })
  }

  // Call SECURITY DEFINER function to mark messages as read
  const { error: rpcError } = await supabase.rpc('mark_messages_read', {
    p_conversation_id: conversationId,
  })

  if (rpcError) {
    console.error('[messages/read/PATCH] RPC error:', rpcError.message)
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
