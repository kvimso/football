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

// Chat thread types
export interface MessageSender {
  id: string
  full_name: string | null
  role: UserRole | null
}

export interface ReferencedPlayer {
  id: string
  name: string
  name_ka: string | null
  position: string | null
  photo_url: string | null
  slug: string
  club: { name: string; name_ka: string | null } | null
}

export interface MessageWithSender {
  id: string
  conversation_id: string
  sender_id: string | null
  content: string | null
  message_type: MessageType
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size_bytes: number | null
  referenced_player_id: string | null
  read_at: string | null
  created_at: string
  sender: MessageSender | null
  referenced_player: ReferencedPlayer | null
  _status?: 'sending' | 'sent' | 'failed'
  _error?: string
}

export interface ConversationDetail {
  id: string
  scout_id: string
  club_id: string
  club: { id: string; name: string; name_ka: string | null; logo_url: string | null }
  other_party: { id: string; full_name: string; organization: string | null; role: UserRole }
  is_blocked: boolean
  blocked_by_me: boolean
  created_at: string
}

// Chat inbox types (used by ChatInbox component and chat-queries)
export interface ConversationClub {
  id: string
  name: string
  name_ka: string
  logo_url: string | null
}

export interface ConversationParty {
  id: string
  full_name: string
  organization: string | null
  role: string
}

export interface ConversationLastMessage {
  content: string | null
  message_type: string
  created_at: string
  sender_id: string
}

export interface ConversationItem {
  id: string
  club: ConversationClub | null
  other_party: ConversationParty
  last_message: ConversationLastMessage | null
  unread_count: number
  is_blocked: boolean
  created_at: string
}

export interface PlayerSearchResult {
  id: string
  name: string
  name_ka: string | null
  position: string | null
  date_of_birth: string | null
  photo_url: string | null
  slug: string
  platform_id: string | null
  club_name: string | null
  club_name_ka: string | null
}
