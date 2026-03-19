/**
 * Starlive (Pixellot) camera data TypeScript interfaces.
 *
 * Three data sources:
 *   Source 1 — Player profile (events, indexes, fitness, player_stats per match)
 *   Source 2 — Heatmap (per player per match)
 *   Source 3 — Match report (per match, both teams)
 *
 * Starlive spellings preserved in raw types: "dribling", "goalkeeing", "contrpressing"
 */

// ============================================================
// Shared primitives
// ============================================================

export interface StarliveEventOutcome {
  sum: number
  per_minute: number
}

export interface StarliveEvent {
  success?: StarliveEventOutcome
  fail?: StarliveEventOutcome
  neutral?: StarliveEventOutcome
}

// ============================================================
// Source 1: Player Profile
// ============================================================

export interface StarliveActivity {
  id: number
  kind: string
  home_team__name: string
  guest_team__name: string
  activity_date: string
  home_team_goals?: number | null
  guest_team_goals: number
  home_team_color: string
  guest_team_color: string
}

export interface StarlivePlayerData {
  id: number
  first_name: string
  last_name: string
  teams: string
  avatar: string | null
  jersey: number[]
  teammates: unknown[]
}

/** Per-match events keyed by date string. activity_id is a separate number field. */
export interface StarliveMatchEvents {
  [eventType: string]: StarliveEvent | number // number is activity_id
}

export interface StarliveIndexCategory {
  forward_play: number | null
  possession: number | null
  dribling: number | null // Starlive spelling
  shooting: number | null
  set_piece: number | null
  total: number | null
}

export interface StarliveDefenceCategory {
  tackling: number | null
  positioning: number | null
  duels: number | null
  pressing: number | null
  goalkeeing: number | null // Starlive spelling
  total: number | null
}

export interface StarliveFitnessCategory {
  distance: number | null
  intensity: number | null
  speed: number | null
  total: number | null
}

export interface StarliveMatchIndexes {
  attack: StarliveIndexCategory
  defence: StarliveDefenceCategory
  fitness: StarliveFitnessCategory
  overall: number | null
  activity_id: number
}

export interface StarliveFitness {
  distance: number
  small_distance: number
  middle_distance: number
  big_distance: number
  sprints_distance: number
  sprints_count: number
  speed_avg: number
  intense_running: number
  // per_minute variants
  distance_per_minute?: number
  small_distance_per_minute?: number
  middle_distance_per_minute?: number
  big_distance_per_minute?: number
  sprints_distance_per_minute?: number
  sprints_count_per_minute?: number
  speed_avg_per_minute?: number
  intense_running_per_minute?: number
  activity_id: number
}

export interface StarlivePlayingTime {
  minutes: number
}

export interface StarlivePlayerMatchStats {
  playing_time: StarlivePlayingTime
  activity_id: number
}

export interface StarlivePlayerProfile {
  player_data: StarlivePlayerData
  activities: StarliveActivity[]
  events: Record<string, StarliveMatchEvents>
  indexes: Record<string, StarliveMatchIndexes>
  fitness: Record<string, StarliveFitness>
  player_stats: Record<string, StarlivePlayerMatchStats>
}

// ============================================================
// Source 2: Heatmap
// ============================================================

export interface StarliveHeatmapEntry {
  fps: number
  field_step: number
  coords: Record<string, number>
}

/** Keyed by player key string */
export type StarliveHeatmap = Record<string, StarliveHeatmapEntry>

// ============================================================
// Source 3: Match Report
// ============================================================

export interface StarliveTeamStatEvent {
  id: number
  timestamp: string
  success: boolean
  thumbnail: string | null
  extra: {
    player: number | null
    video_start: string | null
    video_end: string | null
    event_end: string | null
    coords_start: unknown
    coords_finish: unknown
    additional_events: Record<string, unknown> | null
    training_part_id: number | null
  }
  super_track: unknown
  player: number | null
}

export interface StarliveTeamStat {
  count: number
  count_accurate: number
  percent: number
  value?: number
  events: {
    success?: StarliveTeamStatEvent[]
    fail?: StarliveTeamStatEvent[]
    neutral?: StarliveTeamStatEvent[]
  }
}

export type StarliveTeamsData = Record<string, Record<string, StarliveTeamStat>>

export type StarliveWidgets = Record<string, Record<string, unknown>>

export interface StarliveMatchReport {
  result: {
    teams_data: StarliveTeamsData
    widgets: StarliveWidgets
    intervals_team_stats: Record<string, StarliveTeamsData>
    intervals_widgets: Record<string, StarliveWidgets>
  }
}

// ============================================================
// DB operation types (derived from database.types.ts)
// ============================================================

import type { Database, Json } from '@/lib/database.types'

export type MpsInsert = Database['public']['Tables']['match_player_stats']['Insert']
export type SkillsInsert = Database['public']['Tables']['player_skills']['Insert']

/** Narrowed sync log type with domain constraints on top of the DB type */
export interface SyncLogParams {
  sync_type: 'player' | 'match_report' | 'heatmap' | 'full'
  starlive_id: string | null
  status: 'success' | 'partial' | 'failed' | 'skipped'
  records_synced: number
  records_skipped: number
  errors: string[] | null
  triggered_by: 'webhook' | 'manual' | 'cron'
  triggered_by_user: string | null
  duration_ms: number
}

export type { Json }

export type SyncResult =
  | { status: 'success'; records_synced: number; records_skipped: number; errors: null }
  | { status: 'partial'; records_synced: number; records_skipped: number; errors: string[] }
  | { status: 'failed'; records_synced: 0; records_skipped: number; errors: string[] }
  | { status: 'skipped'; records_synced: 0; records_skipped: number; errors: null; reason: string }
