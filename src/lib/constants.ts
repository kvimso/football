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

export const POSITION_LEFT_BORDER_CLASSES: Record<Position, string> = {
  GK: 'border-l-pos-gk',
  DEF: 'border-l-pos-def',
  MID: 'border-l-pos-mid',
  ATT: 'border-l-pos-att',
  WNG: 'border-l-pos-wng',
  ST: 'border-l-pos-st',
}

export const POSITION_GLOW_CLASSES: Record<Position, string> = {
  GK: 'bg-pos-gk text-white border-pos-gk',
  DEF: 'bg-pos-def text-white border-pos-def',
  MID: 'bg-pos-mid text-white border-pos-mid',
  ATT: 'bg-pos-att text-white border-pos-att',
  WNG: 'bg-pos-wng text-white border-pos-wng',
  ST: 'bg-pos-st text-white border-pos-st',
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

// AI search limits
export const AI_SEARCH_LIMITS = {
  MAX_SEARCHES_PER_HOUR: 20,
  MAX_QUERY_LENGTH: 500,
  MAX_HISTORY_ENTRIES: 4,
} as const

// Chat system limits
export const CHAT_LIMITS = {
  MAX_CONVERSATIONS_PER_DAY: 10,
  MAX_MESSAGES_PER_HOUR: 30,
  MAX_UPLOADS_PER_DAY: 5,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_MESSAGE_LENGTH: 5000,
  MESSAGES_PER_PAGE: 50,
  SIGNED_URL_EXPIRY_SECONDS: 60 * 60, // 1 hour
} as const

export const ALLOWED_CHAT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const ALLOWED_CHAT_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
] as const

// Scout registration country options (top scouting markets first)
export const SCOUT_COUNTRIES = [
  'Georgia',
  'United Kingdom',
  'Germany',
  'Spain',
  'France',
  'Italy',
  'Netherlands',
  'Portugal',
  'Belgium',
  'Turkey',
  'United States',
  'Switzerland',
  'Austria',
  'Denmark',
  'Sweden',
  'Norway',
  'Czech Republic',
  'Poland',
  'Croatia',
  'Greece',
  'Ukraine',
  'Russia',
  'Israel',
  'Japan',
  'South Korea',
  'China',
  'Saudi Arabia',
  'Qatar',
  'UAE',
  'Brazil',
  'Argentina',
  'Australia',
  'Canada',
  'Mexico',
  'Other',
] as const

// Country code mapping for flag emoji display
export const COUNTRY_FLAGS: Record<string, string> = {
  Georgia: '🇬🇪',
  'United Kingdom': '🇬🇧',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Netherlands: '🇳🇱',
  Portugal: '🇵🇹',
  Belgium: '🇧🇪',
  Turkey: '🇹🇷',
  'United States': '🇺🇸',
  Switzerland: '🇨🇭',
  Austria: '🇦🇹',
  Denmark: '🇩🇰',
  Sweden: '🇸🇪',
  Norway: '🇳🇴',
  'Czech Republic': '🇨🇿',
  Poland: '🇵🇱',
  Croatia: '🇭🇷',
  Greece: '🇬🇷',
  Ukraine: '🇺🇦',
  Russia: '🇷🇺',
  Israel: '🇮🇱',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  China: '🇨🇳',
  'Saudi Arabia': '🇸🇦',
  Qatar: '🇶🇦',
  UAE: '🇦🇪',
  Brazil: '🇧🇷',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  Unknown: '🌍',
}

// Light gray placeholder for next/image blur
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4='
