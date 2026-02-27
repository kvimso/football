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

export const POPULAR_VIEWS_THRESHOLD = 20

// Tiny dark placeholder for next/image blur
export const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
