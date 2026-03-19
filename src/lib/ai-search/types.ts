import { z } from 'zod'

/** Structured filters Claude returns — strict mode rejects unknown keys */
export const AISearchFiltersSchema = z
  .object({
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

    // Player skills (1-10 camera ratings)
    min_overall: z.number().int().min(1).max(10).optional(),
    min_attack: z.number().int().min(1).max(10).optional(),
    min_defence: z.number().int().min(1).max(10).optional(),
    min_fitness: z.number().int().min(1).max(10).optional(),
    min_dribbling: z.number().int().min(1).max(10).optional(),
    min_shooting: z.number().int().min(1).max(10).optional(),
    min_possession: z.number().int().min(1).max(10).optional(),
    min_tackling: z.number().int().min(1).max(10).optional(),
    min_positioning: z.number().int().min(1).max(10).optional(),

    // Sorting
    sort_by: z
      .enum([
        'overall',
        'attack',
        'defence',
        'fitness',
        'dribbling',
        'shooting',
        'possession',
        'tackling',
        'positioning',
        'height_cm',
        'age',
      ])
      .optional(),
    sort_direction: z.enum(['asc', 'desc']).optional(),
  })
  .strict()

export type AISearchFilters = z.infer<typeof AISearchFiltersSchema>

export interface AISearchResponse {
  players: Array<Record<string, unknown>>
  filters_applied: AISearchFilters
  query_text: string
  result_count: number
}
