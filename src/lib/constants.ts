import type { Position } from '@/lib/types'

export const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST'] as const

export const PREFERRED_FEET = ['Left', 'Right', 'Both'] as const

export const POSITION_COLOR_CLASSES: Record<Position, string> = {
  GK: 'bg-pos-gk/20 text-pos-gk',
  DEF: 'bg-pos-def/20 text-pos-def',
  MID: 'bg-pos-mid/20 text-pos-mid',
  ATT: 'bg-pos-att/20 text-pos-att',
  WNG: 'bg-pos-wng/20 text-pos-wng',
  ST: 'bg-pos-st/20 text-pos-st',
}

export const POSITION_BORDER_CLASSES: Record<Position, string> = {
  GK: 'border-t-pos-gk',
  DEF: 'border-t-pos-def',
  MID: 'border-t-pos-mid',
  ATT: 'border-t-pos-att',
  WNG: 'border-t-pos-wng',
  ST: 'border-t-pos-st',
}

export const AGE_MIN_DEFAULT = 14
export const AGE_MAX_DEFAULT = 25
export const AGE_OPTIONS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25] as const

export const HEIGHT_OPTIONS = [150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200] as const

export const WEIGHT_OPTIONS = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95] as const

export const STAT_FILTER_OPTIONS = {
  goals: [1, 2, 3, 5, 8, 10, 15, 20],
  assists: [1, 2, 3, 5, 8, 10, 15],
  matches: [5, 10, 15, 20, 25, 30],
  passAccuracy: [50, 60, 70, 75, 80, 85, 90],
} as const

export const POPULAR_VIEWS_THRESHOLD = 20

// Chat system limits
export const CHAT_LIMITS = {
  MAX_CONVERSATIONS_PER_DAY: 10,
  MAX_MESSAGES_PER_HOUR: 30,
  MAX_UPLOADS_PER_DAY: 5,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_MESSAGE_LENGTH: 5000,
  MESSAGES_PER_PAGE: 50,
  SIGNED_URL_EXPIRY_SECONDS: 7 * 24 * 60 * 60, // 7 days
} as const

export const ALLOWED_CHAT_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const ALLOWED_CHAT_FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx',
] as const

// Tiny dark placeholder for next/image blur
export const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
