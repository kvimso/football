import 'server-only'

/**
 * Pure transform functions: Starlive JSON -> DB insert shapes.
 * No database calls. All data quirks handled here.
 *
 * Quirks handled:
 * 1. Dual activity ID system (local vs global) — resolveActivityId uses date matching
 * 2. Missing fields — defaults (0 for counts, null for ratings)
 * 3. Date format inconsistency — normalizeMatchDate normalizes both formats
 * 4. Null index sub-scores — skip nulls in averaging
 * 5. Starlive misspellings — use Starlive keys (dribling, goalkeeing) when reading raw data
 * 6. Event types vary per match — safe access with ?. and defaults
 * 7. Null player in match report — handled by sync layer
 */

import type {
  StarliveActivity,
  StarliveMatchEvents,
  StarliveMatchIndexes,
  StarliveFitness,
  StarlivePlayerMatchStats,
  StarliveMatchReport,
  StarliveHeatmap,
  StarliveHeatmapEntry,
  MatchPlayerStatsInsert,
  PlayerSkillsUpsert,
} from './types'

// ============================================================
// Date normalization (quirk #3)
// ============================================================

/**
 * Normalize Starlive date strings to YYYY-MM-DD for use as join keys.
 * Handles:
 *   "2025-11-11T00:00:00Z"         (activities format)
 *   "2025-11-11 00:00:00+00:00"    (events/indexes key format)
 */
export function normalizeMatchDate(dateStr: string): string {
  return dateStr.slice(0, 10) // Both formats start with YYYY-MM-DD
}

// ============================================================
// Activity ID resolution (quirk #1)
// ============================================================

/**
 * Map a match date string to its global activity ID.
 * Events/indexes use local sequential activity_id (1, 2, 3...),
 * but activities[] have global IDs (54, 55, 56...).
 * The match date is the reliable link between them.
 */
export function resolveActivityId(
  activities: StarliveActivity[],
  matchDateStr: string
): number | null {
  const normalizedDate = normalizeMatchDate(matchDateStr)
  const activity = activities.find((a) => normalizeMatchDate(a.activity_date) === normalizedDate)
  return activity?.id ?? null
}

// ============================================================
// Stat extraction helpers
// ============================================================

/** Safe read of an event outcome sum. Returns 0 if event type or outcome doesn't exist. */
function eventSum(
  events: StarliveMatchEvents,
  eventType: string,
  outcome: 'success' | 'fail' | 'neutral'
): number {
  const event = events[eventType]
  if (typeof event === 'number') return 0 // This is activity_id, not an event
  if (!event) return 0
  return event[outcome]?.sum ?? 0
}

// ============================================================
// Main stat extraction (Source 1 -> match_player_stats)
// ============================================================

export function extractMatchPlayerStats(
  events: StarliveMatchEvents,
  indexes: StarliveMatchIndexes | null,
  fitness: StarliveFitness | null,
  playerStats: StarlivePlayerMatchStats | null,
  matchId: string,
  playerId: string,
  starlivePlayerId: number
): MatchPlayerStatsInsert {
  // Goals come from neutral outcome (quirk: goals are "neutral" events)
  const goals = eventSum(events, 'goal', 'neutral')
  const assists = eventSum(events, 'assist', 'neutral')
  const keyPasses = eventSum(events, 'key_pass', 'neutral')

  // Shots: success = on target, fail = off target
  const shotsOnTarget = eventSum(events, 'shot', 'success')
  const shotsFail = eventSum(events, 'shot', 'fail')
  const shots = shotsOnTarget + shotsFail

  // Passes
  const passesSuccessful = eventSum(events, 'pass', 'success')
  const passesFail = eventSum(events, 'pass', 'fail')
  const passesTotal = passesSuccessful + passesFail
  // pass_success_rate: null when no passes (not 0%, which is semantically wrong)
  const passSuccessRate =
    passesTotal > 0 ? Math.round((passesSuccessful / passesTotal) * 10000) / 100 : null

  // Tackles & interceptions
  const tacklesSuccess = eventSum(events, 'tackle', 'success')
  const tacklesFail = eventSum(events, 'tackle', 'fail')
  const tackles = tacklesSuccess + tacklesFail
  const interceptions = eventSum(events, 'interception', 'neutral')

  // Dribbles
  const dribblesSuccess = eventSum(events, 'dribble', 'success')
  const dribblesFail = eventSum(events, 'dribble', 'fail')

  // Fitness
  const distanceM = fitness?.distance ?? null
  const sprintsCount = fitness?.sprints_count ?? 0
  const speedAvg = fitness?.speed_avg ?? null

  // Rating
  const overallRating = indexes?.overall ?? null

  // Minutes
  const minutesPlayed = playerStats?.playing_time?.minutes ?? null

  return {
    match_id: matchId,
    player_id: playerId,
    starlive_player_id: starlivePlayerId,
    minutes_played: minutesPlayed,
    overall_rating: overallRating,
    goals,
    assists,
    key_passes: keyPasses,
    shots,
    shots_on_target: shotsOnTarget,
    passes_total: passesTotal,
    passes_successful: passesSuccessful,
    pass_success_rate: passSuccessRate,
    tackles,
    interceptions,
    dribbles_success: dribblesSuccess,
    dribbles_fail: dribblesFail,
    distance_m: distanceM,
    sprints_count: sprintsCount,
    speed_avg: speedAvg,
    // Store full JSON for detailed views
    events: events as unknown as Record<string, unknown>,
    indexes: indexes as unknown as Record<string, unknown>,
    fitness: fitness as unknown as Record<string, unknown>,
  }
}

// ============================================================
// Skills recalculation (aggregates indexes across matches)
// ============================================================

/** Average an array of nullable numbers, skipping nulls. Returns null if all null. */
function avgNullable(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  const avg = valid.reduce((sum, v) => sum + v, 0) / valid.length
  return Math.round(avg * 10) / 10 // Round to 1 decimal
}

export function recalculatePlayerSkills(
  playerId: string,
  allMatchIndexes: StarliveMatchIndexes[]
): PlayerSkillsUpsert {
  return {
    player_id: playerId,
    attack: avgNullable(allMatchIndexes.map((i) => i.attack.total)),
    defence: avgNullable(allMatchIndexes.map((i) => i.defence.total)),
    fitness: avgNullable(allMatchIndexes.map((i) => i.fitness.total)),
    overall: avgNullable(allMatchIndexes.map((i) => i.overall)),
    // Attack sub-scores
    forward_play: avgNullable(allMatchIndexes.map((i) => i.attack.forward_play)),
    possession: avgNullable(allMatchIndexes.map((i) => i.attack.possession)),
    dribbling: avgNullable(allMatchIndexes.map((i) => i.attack.dribling)), // Starlive spelling
    shooting: avgNullable(allMatchIndexes.map((i) => i.attack.shooting)),
    set_piece: avgNullable(allMatchIndexes.map((i) => i.attack.set_piece)),
    // Defence sub-scores
    tackling: avgNullable(allMatchIndexes.map((i) => i.defence.tackling)),
    positioning: avgNullable(allMatchIndexes.map((i) => i.defence.positioning)),
    duels: avgNullable(allMatchIndexes.map((i) => i.defence.duels)),
    pressing: avgNullable(allMatchIndexes.map((i) => i.defence.pressing)),
    goalkeeping: avgNullable(allMatchIndexes.map((i) => i.defence.goalkeeing)), // Starlive spelling
    // Fitness sub-scores
    fitness_distance: avgNullable(allMatchIndexes.map((i) => i.fitness.distance)),
    fitness_intensity: avgNullable(allMatchIndexes.map((i) => i.fitness.intensity)),
    fitness_speed: avgNullable(allMatchIndexes.map((i) => i.fitness.speed)),
    matches_counted: allMatchIndexes.length,
    last_updated: new Date().toISOString(),
  }
}

// ============================================================
// Match report extraction (Source 3 -> matches JSONB columns)
// ============================================================

export function extractMatchReportData(report: StarliveMatchReport) {
  return {
    team_stats: report.result.teams_data,
    widgets: report.result.widgets,
    intervals: report.result.intervals_team_stats,
    intervals_widgets: report.result.intervals_widgets,
  }
}

// ============================================================
// Heatmap extraction (Source 2 -> match_heatmaps)
// ============================================================

export function extractHeatmapData(heatmapJson: StarliveHeatmap) {
  const entries = Object.entries(heatmapJson)
  if (entries.length === 0) return null

  const [playerKey, data] = entries[0] as [string, StarliveHeatmapEntry]
  return {
    playerKey,
    coords: data.coords,
    fps: data.fps,
    field_step: data.field_step,
  }
}

// ============================================================
// Match slug generation for camera-created matches
// ============================================================

export function generateCameraMatchSlug(
  homeClubSlug: string,
  awayClubSlug: string,
  matchDate: string,
  activityId: number | null
): string {
  const dateStr = normalizeMatchDate(matchDate)
  const suffix = activityId ? `-${activityId}` : ''
  return `${homeClubSlug}-vs-${awayClubSlug}-${dateStr}${suffix}`
}
