import { z } from 'zod'

/** Structured filters Claude returns — strict mode rejects unknown keys */
export const AISearchFiltersSchema = z.object({
  // Player table filters
  position: z.enum(['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST']).optional(),
  preferred_foot: z.enum(['Left', 'Right', 'Both']).optional(),
  nationality: z.string().max(50).optional(),
  status: z.enum(['active', 'free_agent']).optional(),

  // Age (calculated from date_of_birth)
  min_age: z.number().int().min(10).max(30).optional(),
  max_age: z.number().int().min(10).max(30).optional(),

  // Physical
  min_height_cm: z.number().int().min(140).max(210).optional(),
  max_height_cm: z.number().int().min(140).max(210).optional(),
  min_weight_kg: z.number().int().min(40).max(120).optional(),
  max_weight_kg: z.number().int().min(40).max(120).optional(),

  // Club filter (resolved to UUID server-side)
  club_name: z.string().max(100).optional(),

  // Player skills (1-100 ratings)
  min_pace: z.number().int().min(1).max(100).optional(),
  min_shooting: z.number().int().min(1).max(100).optional(),
  min_passing: z.number().int().min(1).max(100).optional(),
  min_dribbling: z.number().int().min(1).max(100).optional(),
  min_defending: z.number().int().min(1).max(100).optional(),
  min_physical: z.number().int().min(1).max(100).optional(),

  // Season stats filters
  min_goals: z.number().int().min(0).optional(),
  min_assists: z.number().int().min(0).optional(),
  min_matches_played: z.number().int().min(0).optional(),
  min_pass_accuracy: z.number().min(0).max(100).optional(),
  min_tackles: z.number().int().min(0).optional(),
  min_interceptions: z.number().int().min(0).optional(),
  min_clean_sheets: z.number().int().min(0).optional(),
  min_shots_on_target: z.number().int().min(0).optional(),

  // Sorting
  sort_by: z.enum([
    'goals', 'assists', 'pace', 'shooting', 'passing', 'dribbling',
    'defending', 'physical', 'pass_accuracy', 'height_cm', 'age',
    'matches_played', 'tackles', 'interceptions', 'clean_sheets',
    'minutes_played', 'sprints', 'distance_covered_km',
  ]).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
}).strict()

export type AISearchFilters = z.infer<typeof AISearchFiltersSchema>

export interface AISearchResponse {
  players: Array<Record<string, unknown>>
  filters_applied: AISearchFilters
  query_text: string
  result_count: number
}
