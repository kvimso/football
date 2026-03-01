// Domain types — these must match the POSITIONS and PREFERRED_FEET arrays in constants.ts
export type Position = 'GK' | 'DEF' | 'MID' | 'ATT' | 'WNG' | 'ST'
export type PreferredFoot = 'Left' | 'Right' | 'Both'
export type PlayerStatus = 'active' | 'free_agent'
export type UserRole = 'scout' | 'academy_admin' | 'platform_admin'
export type MessageType = 'text' | 'file' | 'player_ref' | 'system'

// Server action result type (discriminated union)
export type ActionResult<T = void> =
  | ({ success: true } & (T extends void ? object : { data: T }))
  | { error: string }
