export type NotificationType =
  | 'goal'
  | 'assist'
  | 'club_change'
  | 'free_agent'
  | 'new_video'
  | 'announcement'

export interface NotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  body?: string
  player_id?: string
  club_id?: string
  link?: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  player_id: string | null
  club_id: string | null
  link: string | null
  is_read: boolean
  created_at: string
}
