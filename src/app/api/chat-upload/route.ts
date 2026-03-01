import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CHAT_LIMITS, ALLOWED_CHAT_FILE_TYPES, ALLOWED_CHAT_FILE_EXTENSIONS } from '@/lib/constants'

// POST: Upload a file attachment for chat
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  // Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const conversationId = formData.get('conversation_id') as string | null

  if (!file || !conversationId) {
    return NextResponse.json({ error: 'errors.invalidInput' }, { status: 400 })
  }

  // Validate conversation_id UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(conversationId)) {
    return NextResponse.json({ error: 'errors.invalidId' }, { status: 400 })
  }

  // Verify user is a participant
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    return NextResponse.json({ error: 'errors.conversationNotFound' }, { status: 404 })
  }

  // Validate file size
  if (file.size > CHAT_LIMITS.MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'errors.fileTooLarge' }, { status: 400 })
  }

  // Validate file type (MIME type check)
  if (!ALLOWED_CHAT_FILE_TYPES.includes(file.type as typeof ALLOWED_CHAT_FILE_TYPES[number])) {
    return NextResponse.json({ error: 'errors.fileTypeNotAllowed' }, { status: 400 })
  }

  // Validate file extension
  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_CHAT_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))
  if (!hasValidExtension) {
    return NextResponse.json({ error: 'errors.fileTypeNotAllowed' }, { status: 400 })
  }

  // Rate limit: max 5 file uploads per user per day
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: uploadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', user.id)
    .eq('message_type', 'file')
    .gte('created_at', oneDayAgo)

  if (uploadCount !== null && uploadCount >= CHAT_LIMITS.MAX_UPLOADS_PER_DAY) {
    return NextResponse.json({ error: 'errors.rateLimitUploads' }, { status: 429 })
  }

  // Generate unique filename
  const ext = fileName.substring(fileName.lastIndexOf('.'))
  const uniqueName = `${crypto.randomUUID()}${ext}`
  const storagePath = `${conversationId}/${uniqueName}`

  // Upload to Supabase Storage
  const fileBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[chat-upload/POST] Upload error:', uploadError.message)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Generate signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, CHAT_LIMITS.SIGNED_URL_EXPIRY_SECONDS)

  if (signedUrlError || !signedUrlData) {
    console.error('[chat-upload/POST] Signed URL error:', signedUrlError?.message)
    return NextResponse.json({ error: 'Failed to generate file URL' }, { status: 500 })
  }

  return NextResponse.json({
    file_url: signedUrlData.signedUrl,
    file_name: file.name,
    file_type: file.type,
    file_size_bytes: file.size,
  })
}
