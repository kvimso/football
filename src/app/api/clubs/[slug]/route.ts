import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'

// GET /api/clubs/[slug] — Club detail with squad
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error

  const { data: club, error } = await supabase
    .from('clubs')
    .select(
      `
      id, name, name_ka, slug, logo_url, city, region,
      description, description_ka, website
    `
    )
    .eq('slug', slug)
    .single()

  if (error || !club) {
    return apiError('errors.clubNotFound', 404)
  }

  // Fetch active players
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(
      `
      id, slug, name, name_ka, position, date_of_birth, height_cm,
      preferred_foot, photo_url, status, platform_id
    `
    )
    .eq('club_id', club.id)
    .eq('status', 'active')
    .order('position')
    .order('name')

  if (playersError) {
    console.error('[api/clubs] Players query error:', playersError.message)
  }

  const squad = (players ?? []).map((p) => ({ ...p }))

  return apiSuccess({
    ...club,
    squad,
  })
}
