import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { unwrapRelation } from '@/lib/utils'

/**
 * Cached Supabase user + client for the current RSC render pass.
 * NOT a server action (no 'use server') — safe to wrap with React.cache.
 * Deduplicates getUser() calls across layout → page within the same request.
 */
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user: error ? null : user, supabase }
})

/**
 * Cached admin profile (role, club_id, full_name, club) for the current RSC render pass.
 * Call after getCachedUser() to avoid redundant profile queries in admin layout + page.
 */
export const getCachedAdminProfile = cache(async (userId: string) => {
  const { supabase } = await getCachedUser()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, club_id, full_name, club:clubs!profiles_club_id_fkey(name, name_ka)')
    .eq('id', userId)
    .single()
  if (error || !profile) return null
  return { ...profile, club: unwrapRelation(profile.club) }
})
