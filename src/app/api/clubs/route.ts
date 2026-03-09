import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'

// GET /api/clubs — Club listing with player counts
export async function GET(request: NextRequest) {
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error

  const { data: clubs, error } = await supabase
    .from('clubs')
    .select(
      `
      id, name, name_ka, slug, logo_url, city, region, description, description_ka, website,
      player_count:players(count)
    `
    )
    .order('name')

  if (error) {
    console.error('[api/clubs] Query error:', error.message)
    return apiError('errors.serverError', 500)
  }

  const results = (clubs ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    name_ka: c.name_ka,
    slug: c.slug,
    logo_url: c.logo_url,
    city: c.city,
    region: c.region,
    description: c.description,
    description_ka: c.description_ka,
    website: c.website,
    player_count: Array.isArray(c.player_count) ? (c.player_count[0]?.count ?? 0) : 0,
  }))

  return apiSuccess(results, { total: results.length })
}
