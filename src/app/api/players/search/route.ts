import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/players/search?q=query&limit=10
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'errors.notAuthenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const limitParam = parseInt(searchParams.get('limit') ?? '10', 10)
  const limit = Math.min(Math.max(limitParam, 1), 20)

  if (!query || query.length < 1) {
    return NextResponse.json({ players: [] })
  }

  const pattern = `%${query}%`

  const { data: players, error } = await supabase
    .from('players')
    .select(`
      id, name, name_ka, position, date_of_birth, photo_url, slug, platform_id,
      club:clubs!players_club_id_fkey ( name, name_ka )
    `)
    .or(`name.ilike.${pattern},name_ka.ilike.${pattern}`)
    .in('status', ['active', 'free_agent'])
    .limit(limit)

  if (error) {
    console.error('[players/search] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = (players ?? []).map((p) => {
    const club = Array.isArray(p.club) ? p.club[0] : p.club
    return {
      id: p.id,
      name: p.name,
      name_ka: p.name_ka,
      position: p.position,
      date_of_birth: p.date_of_birth,
      photo_url: p.photo_url,
      slug: p.slug,
      platform_id: p.platform_id,
      club_name: club?.name ?? null,
      club_name_ka: club?.name_ka ?? null,
    }
  })

  return NextResponse.json({ players: results })
}
