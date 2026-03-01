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
