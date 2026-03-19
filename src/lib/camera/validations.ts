import 'server-only'

import { z } from 'zod'

/**
 * Zod schemas for runtime validation of Starlive JSON payloads.
 * Validates at the API boundary only — transform functions receive pre-validated data.
 *
 * JSONB size limits:
 *   events: max 500KB
 *   indexes/fitness: max 100KB each
 */

// ============================================================
// Size validation helpers
// ============================================================

const MAX_EVENTS_SIZE = 500 * 1024 // 500KB
const MAX_INDEX_SIZE = 100 * 1024 // 100KB
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024 // 10MB

function jsonSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

// ============================================================
// Source 1: Player Profile schema
// ============================================================

const starliveEventOutcomeSchema = z.object({
  sum: z.number(),
  per_minute: z.number(),
})

const starliveEventSchema = z.object({
  success: starliveEventOutcomeSchema.optional(),
  fail: starliveEventOutcomeSchema.optional(),
  neutral: starliveEventOutcomeSchema.optional(),
})

const starliveActivitySchema = z.object({
  id: z.number(),
  kind: z.string(),
  home_team__name: z.string(),
  guest_team__name: z.string(),
  activity_date: z.string(),
  home_team_goals: z.number().nullable().optional(),
  guest_team_goals: z.number(),
  home_team_color: z.string(),
  guest_team_color: z.string(),
})

const starlivePlayerDataSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  teams: z.string(),
  avatar: z.string().nullable(),
  jersey: z.array(z.number()),
  teammates: z.array(z.unknown()),
})

// Match events: record of event type -> StarliveEvent, plus activity_id as number
const starliveMatchEventsSchema = z.record(z.string(), z.union([starliveEventSchema, z.number()]))

const starliveIndexCategorySchema = z.object({
  forward_play: z.number().nullable(),
  possession: z.number().nullable(),
  dribling: z.number().nullable(), // Starlive spelling
  shooting: z.number().nullable(),
  set_piece: z.number().nullable(),
  total: z.number().nullable(),
})

const starliveDefenceCategorySchema = z.object({
  tackling: z.number().nullable(),
  positioning: z.number().nullable(),
  duels: z.number().nullable(),
  pressing: z.number().nullable(),
  goalkeeing: z.number().nullable(), // Starlive spelling
  total: z.number().nullable(),
})

const starliveFitnessCategorySchema = z.object({
  distance: z.number().nullable(),
  intensity: z.number().nullable(),
  speed: z.number().nullable(),
  total: z.number().nullable(),
})

const starliveMatchIndexesSchema = z.object({
  attack: starliveIndexCategorySchema,
  defence: starliveDefenceCategorySchema,
  fitness: starliveFitnessCategorySchema,
  overall: z.number().nullable(),
  activity_id: z.number(),
})

const starliveFitnessSchema = z
  .object({
    distance: z.number(),
    small_distance: z.number(),
    middle_distance: z.number(),
    big_distance: z.number(),
    sprints_distance: z.number(),
    sprints_count: z.number(),
    speed_avg: z.number(),
    intense_running: z.number(),
    // per_minute variants (optional)
    distance_per_minute: z.number().optional(),
    small_distance_per_minute: z.number().optional(),
    middle_distance_per_minute: z.number().optional(),
    big_distance_per_minute: z.number().optional(),
    sprints_distance_per_minute: z.number().optional(),
    sprints_count_per_minute: z.number().optional(),
    speed_avg_per_minute: z.number().optional(),
    intense_running_per_minute: z.number().optional(),
    activity_id: z.number(),
  })
  .passthrough() // Allow any additional fields Starlive may add

const starlivePlayerMatchStatsSchema = z.object({
  playing_time: z.object({ minutes: z.number() }),
  activity_id: z.number(),
})

export const starlivePlayerProfileSchema = z.object({
  player_data: starlivePlayerDataSchema,
  activities: z.array(starliveActivitySchema).min(1),
  events: z
    .record(z.string(), starliveMatchEventsSchema)
    .refine((val) => jsonSize(val) <= MAX_EVENTS_SIZE, {
      message: `Events JSONB exceeds ${MAX_EVENTS_SIZE / 1024}KB limit`,
    }),
  indexes: z
    .record(z.string(), starliveMatchIndexesSchema)
    .refine((val) => jsonSize(val) <= MAX_INDEX_SIZE, {
      message: `Indexes JSONB exceeds ${MAX_INDEX_SIZE / 1024}KB limit`,
    }),
  fitness: z
    .record(z.string(), starliveFitnessSchema)
    .refine((val) => jsonSize(val) <= MAX_INDEX_SIZE, {
      message: `Fitness JSONB exceeds ${MAX_INDEX_SIZE / 1024}KB limit`,
    }),
  player_stats: z.record(z.string(), starlivePlayerMatchStatsSchema),
})

// ============================================================
// Source 2: Heatmap schema
// ============================================================

const starliveHeatmapEntrySchema = z.object({
  fps: z.number(),
  field_step: z.number(),
  coords: z.record(z.string(), z.number()),
})

export const starliveHeatmapSchema = z.record(z.string(), starliveHeatmapEntrySchema)

// ============================================================
// Source 3: Match Report schema
// ============================================================

const starliveTeamStatSchema = z.object({
  count: z.number(),
  count_accurate: z.number(),
  percent: z.number(),
  value: z.number().optional(),
  events: z
    .object({
      success: z.array(z.unknown()).optional(),
      fail: z.array(z.unknown()).optional(),
      neutral: z.array(z.unknown()).optional(),
    })
    .passthrough(),
})

export const starliveMatchReportSchema = z.object({
  result: z.object({
    teams_data: z.record(z.string(), z.record(z.string(), starliveTeamStatSchema)),
    widgets: z.record(z.string(), z.record(z.string(), z.unknown())),
    intervals_team_stats: z.record(
      z.string(),
      z.record(z.string(), z.record(z.string(), starliveTeamStatSchema))
    ),
    intervals_widgets: z.record(
      z.string(),
      z.record(z.string(), z.record(z.string(), z.unknown()))
    ),
  }),
})

// ============================================================
// Sync request schema (discriminated union)
// ============================================================

export const syncRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('player'),
    data: starlivePlayerProfileSchema,
  }),
  z.object({
    type: z.literal('match_report'),
    data: starliveMatchReportSchema,
    match_id: z.string().uuid(),
  }),
  z.object({
    type: z.literal('heatmap'),
    data: starliveHeatmapSchema,
    match_id: z.string().uuid(),
  }),
])

export { MAX_PAYLOAD_SIZE }
