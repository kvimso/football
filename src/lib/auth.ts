'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminContext = {
  error: string | null
  clubId: string | null
  supabase: Awaited<ReturnType<typeof createClient>> | null
  userId: string | null
}

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', clubId: null, supabase: null, userId: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found', clubId: null, supabase: null, userId: null }
  if (profile.role !== 'academy_admin') {
    return { error: 'Unauthorized', clubId: null, supabase: null, userId: null }
  }
  if (!profile.club_id) return { error: 'No club assigned', clubId: null, supabase: null, userId: null }

  return { error: null, clubId: profile.club_id, supabase, userId: user.id }
}

type PlatformAdminContext = {
  error: string | null
  admin: ReturnType<typeof createAdminClient> | null
  userId: string | null
}

export async function getPlatformAdminContext(): Promise<PlatformAdminContext> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', admin: null, userId: null }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found', admin: null, userId: null }
  if (profile.role !== 'platform_admin') return { error: 'Unauthorized', admin: null, userId: null }

  return { error: null, admin: createAdminClient(), userId: user.id }
}
