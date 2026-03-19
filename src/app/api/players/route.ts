import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest, parseIntParam } from '@/lib/api-utils'
import { unwrapRelation, escapePostgrestValue } from '@/lib/utils'
import type { Position, PlayerStatus } from '@/lib/types'

const PAGE_SIZE = 24

// GET /api/players — Player directory with full filter support
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error

  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')
  const age_min = searchParams.get('age_min')
  const age_max = searchParams.get('age_max')
  const club = searchParams.get('club')
  const foot = searchParams.get('foot')
  const q = searchParams.get('q')
  const status = searchParams.get('status')
  const sort = searchParams.get('sort')
  const height_min = searchParams.get('height_min')
  const height_max = searchParams.get('height_max')
  const weight_min = searchParams.get('weight_min')
  const weight_max = searchParams.get('weight_max')
  const page = parseIntParam(searchParams.get('page'), 1, 1, 1000)
  const limit = parseIntParam(searchParams.get('limit'), PAGE_SIZE, 1, 100)

  let query = supabase
    .from('players')
    .select(
      `
      id, slug, name, name_ka, position, date_of_birth, height_cm, weight_kg,
      preferred_foot, is_featured, photo_url, status, platform_id,
      club:clubs!players_club_id_fkey ( id, name, name_ka, slug )
    `,
      { count: 'exact' }
    )
    .order('is_featured', { ascending: false })
    .order('name')

  // Filter by status
  if (status === 'active') {
    query = query.eq('status', 'active')
  } else if (status === 'free_agent') {
    query = query.eq('status', 'free_agent')
  } else {
    query = query.in('status', ['active', 'free_agent'])
  }

  // Multi-select position filter
  if (position) {
    const positions = position.split(',').filter(Boolean)
    if (positions.length > 0) query = query.in('position', positions)
  }

  // Multi-select club filter
  if (club) {
    const clubIds = club.split(',').filter(Boolean)
    if (clubIds.length > 0) query = query.in('club_id', clubIds)
  }

  if (foot) query = query.eq('preferred_foot', foot)

  if (q) {
    const sanitized = escapePostgrestValue(q)
    if (sanitized) {
      query = query.or(`name.ilike.%${sanitized}%,name_ka.ilike.%${sanitized}%`)
    }
  }

  // Height filters
  if (height_min) {
    const hMin = parseInt(height_min, 10)
    if (!isNaN(hMin)) query = query.gte('height_cm', hMin)
  }
  if (height_max) {
    const hMax = parseInt(height_max, 10)
    if (!isNaN(hMax)) query = query.lte('height_cm', hMax)
  }

  // Weight filters
  if (weight_min) {
    const wMin = parseInt(weight_min, 10)
    if (!isNaN(wMin)) query = query.gte('weight_kg', wMin)
  }
  if (weight_max) {
    const wMax = parseInt(weight_max, 10)
    if (!isNaN(wMax)) query = query.lte('weight_kg', wMax)
  }

  // Age filter — convert to DOB boundaries
  if (age_min || age_max) {
    const today = new Date()
    let minAge = age_min ? parseInt(age_min, 10) : 0
    let maxAge = age_max ? parseInt(age_max, 10) : 99
    if (minAge > maxAge) [minAge, maxAge] = [maxAge, minAge]

    const maxDob = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    query = query.lte('date_of_birth', maxDob.toISOString().split('T')[0])

    const minDob = new Date(today.getFullYear() - (maxAge + 1), today.getMonth(), today.getDate())
    query = query.gt('date_of_birth', minDob.toISOString().split('T')[0])
  }

  // most_viewed sort requires client-side processing
  if (sort !== 'most_viewed') {
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)
  } else {
    query = query.limit(500)
  }

  const { data: players, error: playersError, count: totalCount } = await query

  if (playersError) {
    console.error('[api/players] Query error:', playersError.message)
    return apiError('errors.serverError', 500)
  }

  // Map results
  const allPlayers = (players ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    name_ka: p.name_ka,
    platform_id: p.platform_id,
    position: p.position as Position,
    date_of_birth: p.date_of_birth,
    height_cm: p.height_cm,
    weight_kg: p.weight_kg,
    preferred_foot: p.preferred_foot,
    is_featured: p.is_featured,
    photo_url: p.photo_url,
    status: (p.status ?? 'active') as PlayerStatus,
    club: unwrapRelation(p.club),
  }))

  // Paginate client-side for most_viewed sort
  const needsClientPagination = sort === 'most_viewed'
  const results = needsClientPagination
    ? allPlayers.slice((page - 1) * limit, page * limit)
    : allPlayers

  const total = needsClientPagination ? allPlayers.length : (totalCount ?? 0)

  return apiSuccess(results, {
    total,
    page,
    per_page: limit,
    total_pages: Math.ceil(total / limit),
  })
}
