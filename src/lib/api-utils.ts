import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

/** Standard API success response */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? null, error: null })
}

/** Standard API error response */
export function apiError(message: string, status: number) {
  return NextResponse.json({ data: null, meta: null, error: message }, { status })
}

/** Authenticate a request and return user + profile, or an error response */
export async function authenticateRequest(supabase: SupabaseClient<Database>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { user: null, profile: null, error: apiError('errors.notAuthenticated', 401) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { user: null, profile: null, error: apiError('errors.profileNotFound', 403) }
  }

  return { user, profile, error: null }
}

/** Parse a numeric query param with min/max/default */
export function parseIntParam(value: string | null, defaultVal: number, min: number, max: number): number {
  if (!value) return defaultVal
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return defaultVal
  return Math.min(Math.max(parsed, min), max)
}
