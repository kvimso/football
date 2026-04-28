/**
 * Derive the display name for a conversation partner.
 * Scouts see the club name; admins see the scout name.
 * Handles both ConversationItem (nullable club) and ConversationDetail (non-null club).
 */
export function getConversationDisplayName(
  club: { name: string } | null | undefined,
  otherParty: { full_name: string },
  userRole: 'scout' | 'academy_admin'
): string {
  const rawName = userRole === 'scout' ? (club?.name ?? otherParty.full_name) : otherParty.full_name
  return rawName || (userRole === 'scout' ? 'the club' : 'Unknown scout')
}

/**
 * Smart timestamp for chat inbox:
 * - Today: "2:45 PM"
 * - Yesterday: "Yesterday"
 * - This week: weekday name
 * - Older: "Mar 1"
 */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Truncate a message to maxLen characters, appending "..." if truncated.
 */
export function truncateMessage(text: string, maxLen: number = 60): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '...'
}

/**
 * Format date divider label: "Today", "Yesterday", "March 1, 2026"
 */
export function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Group messages by local date for date divider insertion.
 */
export function groupMessagesByDate<T extends { created_at: string }>(
  messages: T[]
): { date: string; messages: T[] }[] {
  const groups: { date: string; messages: T[] }[] = []

  for (const msg of messages) {
    const date = new Date(msg.created_at)
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ date: dateKey, messages: [msg] })
    }
  }

  return groups
}

/**
 * Check if two timestamps are within the same N-minute window.
 */
export function isSameTimeGroup(a: string, b: string, windowMinutes: number = 5): boolean {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime())
  return diff < windowMinutes * 60 * 1000
}

/**
 * Format time for message bubble: "2:45 PM"
 */
export function formatBubbleTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Format file size for display: "1.2 MB", "450 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Check if a MIME type represents an image.
 */
export function isImageType(mimeType: string | null): boolean {
  return !!mimeType && mimeType.startsWith('image/')
}

/**
 * Parse a message string and return an array of text parts and link parts.
 * Only matches URLs with http:// or https:// protocol (never javascript:).
 * Strips trailing punctuation from URLs.
 */
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi

export type MessagePart = string | { type: 'link'; url: string }

export function linkifyMessage(content: string): MessagePart[] {
  const parts: MessagePart[] = []
  let lastIndex = 0

  URL_REGEX.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = URL_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index))
    }
    let url = match[0]
    while (/[.,;:!?)}\]>]$/.test(url)) url = url.slice(0, -1)
    parts.push({ type: 'link', url })
    lastIndex = match.index + url.length
    URL_REGEX.lastIndex = lastIndex
  }

  if (lastIndex < content.length) parts.push(content.slice(lastIndex))
  URL_REGEX.lastIndex = 0

  return parts.length > 0 ? parts : [content]
}

/**
 * Check if a message contains only emoji characters (1-6 emoji, no text).
 * Used to render emoji-only messages at a larger font size.
 */
const EMOJI_ONLY_REGEX =
  // eslint-disable-next-line no-misleading-character-class -- FE0F/200D are intentional emoji modifiers
  /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\s]+$/u

export function isEmojiOnly(text: string): boolean {
  if (!text || text.length > 30) return false
  const trimmed = text.trim()
  if (!trimmed) return false
  const emojiMatches = trimmed.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu)
  if (!emojiMatches || emojiMatches.length > 6) return false
  return EMOJI_ONLY_REGEX.test(trimmed)
}

/**
 * Generate a short preview string for the last message in a conversation.
 * Used by ChatSidebar and ChatInbox to show message previews in the list.
 */
export function getLastMessagePreview(
  conv: {
    last_message: { content: string | null; message_type: string; sender_id: string } | null
  },
  userId: string,
  maxLen: number = 50
): string {
  if (!conv.last_message) return ''

  const { content, message_type, sender_id } = conv.last_message
  const isMe = sender_id === userId
  const prefix = isMe ? 'You: ' : ''

  switch (message_type) {
    case 'file':
      return prefix + 'Sent a file'
    case 'player_ref':
      return prefix + 'Shared a player'
    case 'system':
      return 'System message'
    default:
      return prefix + truncateMessage(content ?? '', maxLen)
  }
}
