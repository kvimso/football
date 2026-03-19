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
// DB operation types (derived from schema, used by sync)
// ============================================================

export interface MatchPlayerStatsInsert {
  match_id: string
  player_id: string
  starlive_player_id: number
  minutes_played: number | null
  overall_rating: number | null
  goals: number
  assists: number
  key_passes: number
  shots: number
  shots_on_target: number
  passes_total: number
  passes_successful: number
  pass_success_rate: number | null
  tackles: number
  interceptions: number
  dribbles_success: number
  dribbles_fail: number
  distance_m: number | null
  sprints_count: number
  speed_avg: number | null
  events: Record<string, unknown> | null
  indexes: Record<string, unknown> | null
  fitness: Record<string, unknown> | null
}

export interface PlayerSkillsUpsert {
  player_id: string
  attack: number | null
  defence: number | null
  fitness: number | null
  overall: number | null
  forward_play: number | null
  possession: number | null
  dribbling: number | null
  shooting: number | null
  set_piece: number | null
  tackling: number | null
  positioning: number | null
  duels: number | null
  pressing: number | null
  goalkeeping: number | null
  fitness_distance: number | null
  fitness_intensity: number | null
  fitness_speed: number | null
  matches_counted: number
  last_updated: string
}

export interface SyncLogInsert {
  sync_type: 'player' | 'match_report' | 'heatmap' | 'full'
  starlive_id: string | null
  status: 'success' | 'partial' | 'failed'
  records_synced: number
  records_skipped: number
  errors: string[] | null
  triggered_by: 'webhook' | 'manual' | 'cron'
  triggered_by_user: string | null
  duration_ms: number
}

export type SyncResult =
  | { status: 'success'; records_synced: number; records_skipped: number; errors: null }
  | { status: 'partial'; records_synced: number; records_skipped: number; errors: string[] }
  | { status: 'failed'; records_synced: 0; records_skipped: number; errors: string[] }
  | { status: 'skipped'; records_synced: 0; records_skipped: number; errors: null; reason: string }

// ============================================================
// Sync request types (shared by webhook + manual sync routes)
// ============================================================

export type SyncRequestPayload =
  | { type: 'player'; data: StarlivePlayerProfile }
  | { type: 'match_report'; data: StarliveMatchReport; match_id: string }
  | { type: 'heatmap'; data: StarliveHeatmap; match_id: string }
