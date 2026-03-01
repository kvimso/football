import type { Lang } from '@/lib/translations'

/**
 * Smart timestamp for chat inbox:
 * - Today: "2:45 PM"
 * - Yesterday: "Yesterday" / "გუშინ"
 * - This week: weekday name
 * - Older: "Mar 1" / "1 მარ"
 */
export function formatMessageTime(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr)
  const now = new Date()

  // Compare dates ignoring time
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString(lang === 'ka' ? 'ka-GE' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  if (diffDays === 1) {
    return lang === 'ka' ? 'გუშინ' : 'Yesterday'
  }
  if (diffDays < 7) {
    return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
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
export function formatDateDivider(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - messageDay.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return lang === 'ka' ? 'დღეს' : 'Today'
  if (diffDays === 1) return lang === 'ka' ? 'გუშინ' : 'Yesterday'

  return date.toLocaleDateString(lang === 'ka' ? 'ka-GE' : 'en-US', {
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
export function formatBubbleTime(dateStr: string, lang: Lang): string {
  return new Date(dateStr).toLocaleTimeString(lang === 'ka' ? 'ka-GE' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Check if a file_url is a storage path (not a full URL).
 */
export function isStoragePath(url: string): boolean {
  return !url.startsWith('http')
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
