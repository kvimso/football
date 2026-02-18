export const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST'] as const
export type Position = (typeof POSITIONS)[number]

export const REGIONS = [
  'Tbilisi',
  'Batumi',
  'Kutaisi',
  'Rustavi',
  'Gori',
  'Zugdidi',
  'Poti',
  'Telavi',
  'Ozurgeti',
  'Senaki',
] as const

export const STAT_SKILLS = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physical',
] as const

export const PREFERRED_FEET = ['Left', 'Right', 'Both'] as const

export const PLAYER_STATUSES = [
  'active',
  'injured',
  'transferred',
  'inactive',
] as const

export const CONTACT_REQUEST_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const

export const USER_ROLES = [
  'scout',
  'academy_admin',
  'platform_admin',
] as const

export const POSITION_COLOR_CLASSES: Record<string, string> = {
  GK: 'bg-pos-gk/20 text-pos-gk',
  DEF: 'bg-pos-def/20 text-pos-def',
  MID: 'bg-pos-mid/20 text-pos-mid',
  ATT: 'bg-pos-att/20 text-pos-att',
  WNG: 'bg-pos-wng/20 text-pos-wng',
  ST: 'bg-pos-st/20 text-pos-st',
}

export const AGE_RANGES = [
  { value: 'u16', label: 'U16', min: 0, max: 15 },
  { value: 'u17', label: 'U17', min: 16, max: 16 },
  { value: 'u18', label: 'U18', min: 17, max: 17 },
  { value: 'u19', label: 'U19', min: 18, max: 18 },
  { value: '19+', label: '19+', min: 19, max: 99 },
] as const

export const AGE_RANGE_MAP: Record<string, { min: number; max: number }> = {
  u16: { min: 0, max: 15 },
  u17: { min: 16, max: 16 },
  u18: { min: 17, max: 17 },
  u19: { min: 18, max: 18 },
  '19+': { min: 19, max: 99 },
}
