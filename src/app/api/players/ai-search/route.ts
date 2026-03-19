import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { authenticateRequest, apiSuccess, apiError } from '@/lib/api-utils'
import { parseSearchQuery } from '@/lib/ai-search/service'
import { escapePostgrestValue } from '@/lib/utils'
import { AI_SEARCH_LIMITS } from '@/lib/constants'
import { z } from 'zod'
import { AISearchFiltersSchema, type AISearchFilters } from '@/lib/ai-search/types'

const RequestSchema = z.object({
  query: z.string().min(1).max(500),
  /** When provided, skips Claude call and uses these filters directly (for re-queries) */
  filters: AISearchFiltersSchema.optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createApiClient(request)
    const auth = await authenticateRequest(supabase)
    if (!auth.ok) return auth.error
    const { user } = auth

    // 2. Feature flag check
    if (process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED !== 'true') {
      return apiError('errors.aiSearchUnavailable', 503)
    }

    // 3. Parse + validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('errors.invalidInput', 400)
    }
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return apiError('errors.invalidInput', 400)
    }
    const { query, filters: providedFilters } = parsed.data
    const isRequery = !!providedFilters

    // 4. Rate limit check (skip for re-queries — no Claude call)
    if (!isRequery) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count: recentCount } = await supabase
        .from('ai_search_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo)

      if (recentCount !== null && recentCount >= AI_SEARCH_LIMITS.MAX_SEARCHES_PER_HOUR) {
        return apiError('errors.rateLimitSearch', 429)
      }
    }

    // 5. Get filters: from Claude API or provided directly
    const filters = isRequery ? providedFilters : await parseSearchQuery(query)

    // 6. Build Supabase query from filters
    let dbQuery = supabase.from('players').select(`
        id, slug, name, name_ka, position, date_of_birth,
        height_cm, weight_kg, preferred_foot, is_featured,
        photo_url, status, nationality,
        club:clubs!players_club_id_fkey (id, name, name_ka),
        player_skills (overall, attack, defence, fitness, dribbling, shooting, possession, tackling, positioning, matches_counted)
      `)

    // Status filter (default: show both active and free_agent)
    if (filters.status) {
      dbQuery = dbQuery.eq('status', filters.status)
    } else {
      dbQuery = dbQuery.in('status', ['active', 'free_agent'])
    }

    // Position filter
    if (filters.position) {
      dbQuery = dbQuery.eq('position', filters.position)
    }

    // Preferred foot
    if (filters.preferred_foot) {
      dbQuery = dbQuery.eq('preferred_foot', filters.preferred_foot)
    }

    // Nationality
    if (filters.nationality) {
      const sanitized = escapePostgrestValue(filters.nationality)
      if (sanitized) {
        dbQuery = dbQuery.ilike('nationality', `%${sanitized}%`)
      }
    }

    // Height filters
    if (filters.min_height_cm) {
      dbQuery = dbQuery.gte('height_cm', filters.min_height_cm)
    }
    if (filters.max_height_cm) {
      dbQuery = dbQuery.lte('height_cm', filters.max_height_cm)
    }

    // Weight filters
    if (filters.min_weight_kg) {
      dbQuery = dbQuery.gte('weight_kg', filters.min_weight_kg)
    }
    if (filters.max_weight_kg) {
      dbQuery = dbQuery.lte('weight_kg', filters.max_weight_kg)
    }

    // Club name resolution
    if (filters.club_name) {
      const sanitizedClub = escapePostgrestValue(filters.club_name)
      if (sanitizedClub) {
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id')
          .or(`name.ilike.%${sanitizedClub}%,name_ka.ilike.%${sanitizedClub}%`)

        if (clubs && clubs.length > 0) {
          dbQuery = dbQuery.in(
            'club_id',
            clubs.map((c) => c.id)
          )
        } else {
          // Club not found — return empty results
          return apiSuccess({
            players: [],
            filters_applied: filters,
            query_text: query,
            result_count: 0,
          })
        }
      }
    }

    // Age filters (converted to DOB boundaries)
    const today = new Date()
    if (filters.max_age) {
      const minDOB = new Date(
        today.getFullYear() - (filters.max_age + 1),
        today.getMonth(),
        today.getDate()
      )
      dbQuery = dbQuery.gt('date_of_birth', minDOB.toISOString().split('T')[0])
    }
    if (filters.min_age) {
      const maxDOB = new Date(
        today.getFullYear() - filters.min_age,
        today.getMonth(),
        today.getDate()
      )
      dbQuery = dbQuery.lte('date_of_birth', maxDOB.toISOString().split('T')[0])
    }

    // Execute query
    const { data: players, error: dbError } = await dbQuery.limit(50)

    if (dbError) {
      console.error('[ai-search] DB query error:', dbError.message)
      return apiError('errors.serverError', 500)
    }

    let filteredPlayers = players ?? []

    // 7. Post-filter by skills (player_skills is an array from join, 1-10 scale)
    const hasSkillFilter =
      filters.min_overall ||
      filters.min_attack ||
      filters.min_defence ||
      filters.min_fitness ||
      filters.min_dribbling ||
      filters.min_shooting ||
      filters.min_possession ||
      filters.min_tackling ||
      filters.min_positioning

    if (hasSkillFilter) {
      filteredPlayers = filteredPlayers.filter((player) => {
        const skillsArr = Array.isArray(player.player_skills) ? player.player_skills : []
        const skills = skillsArr[0] as Record<string, number | null> | undefined
        if (!skills) return false
        if (filters.min_overall && (skills.overall ?? 0) < filters.min_overall) return false
        if (filters.min_attack && (skills.attack ?? 0) < filters.min_attack) return false
        if (filters.min_defence && (skills.defence ?? 0) < filters.min_defence) return false
        if (filters.min_fitness && (skills.fitness ?? 0) < filters.min_fitness) return false
        if (filters.min_dribbling && (skills.dribbling ?? 0) < filters.min_dribbling) return false
        if (filters.min_shooting && (skills.shooting ?? 0) < filters.min_shooting) return false
        if (filters.min_possession && (skills.possession ?? 0) < filters.min_possession)
          return false
        if (filters.min_tackling && (skills.tackling ?? 0) < filters.min_tackling) return false
        if (filters.min_positioning && (skills.positioning ?? 0) < filters.min_positioning)
          return false
        return true
      })
    }

    // 8. Sort results
    if (filters.sort_by) {
      const dir = filters.sort_direction === 'asc' ? 1 : -1
      filteredPlayers.sort((a, b) => {
        const sortKey = filters.sort_by!
        let valA = 0
        let valB = 0

        // Skill fields (camera 1-10 scale)
        const skillFields = [
          'overall',
          'attack',
          'defence',
          'fitness',
          'dribbling',
          'shooting',
          'possession',
          'tackling',
          'positioning',
        ]
        if (skillFields.includes(sortKey)) {
          const skillsA = Array.isArray(a.player_skills) ? a.player_skills[0] : null
          const skillsB = Array.isArray(b.player_skills) ? b.player_skills[0] : null
          valA = (skillsA as Record<string, number> | null)?.[sortKey] ?? 0
          valB = (skillsB as Record<string, number> | null)?.[sortKey] ?? 0
        }

        // Player fields
        if (sortKey === 'height_cm') {
          valA = a.height_cm ?? 0
          valB = b.height_cm ?? 0
        }
        if (sortKey === 'age') {
          // Older = higher age, so reversed DOB comparison
          valA = a.date_of_birth ? new Date(a.date_of_birth).getTime() : 0
          valB = b.date_of_birth ? new Date(b.date_of_birth).getTime() : 0
          return dir * (valB - valA)
        }

        return dir * (valA - valB)
      })
    }

    // 9. Save to search history (fire-and-forget, skip for re-queries)
    if (!isRequery) {
      saveSearchHistory(supabase, user.id, query, filters, filteredPlayers.length)
    }

    // 10. Return results
    return apiSuccess({
      players: filteredPlayers,
      filters_applied: filters,
      query_text: query,
      result_count: filteredPlayers.length,
    })
  } catch (error) {
    console.error('[ai-search] Unexpected error:', error)
    return apiError('errors.serverError', 500)
  }
}

/** Fire-and-forget: save search + evict old entries */
function saveSearchHistory(
  supabase: Awaited<ReturnType<typeof createApiClient>>,
  userId: string,
  queryText: string,
  filters: AISearchFilters,
  resultCount: number
) {
  supabase
    .from('ai_search_history')
    .insert({
      user_id: userId,
      query_text: queryText,
      filters_applied: filters,
      result_count: resultCount,
    })
    .then(({ error }) => {
      if (error) {
        console.error('[ai-search] History insert error:', error.message)
        return
      }
      // Evict entries beyond the 4th (FIFO)
      supabase
        .from('ai_search_history')
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(4, 100)
        .then(({ data: old }) => {
          if (old && old.length > 0) {
            supabase
              .from('ai_search_history')
              .delete()
              .in(
                'id',
                old.map((o) => o.id)
              )
              .then(() => {
                /* eviction done */
              })
          }
        })
    })
}
