import { NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

/** Standard API success response */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? null, error: null })
}

/** Standard API error response */
export function apiError(message: string, status: number) {
  return NextResponse.json({ data: null, meta: null, error: message }, { status })
}

type AuthProfile = { role: string; club_id: string | null; full_name: string | null }

export type AuthResult =
  | { ok: true; user: User; profile: AuthProfile }
  | { ok: false; error: NextResponse }

/** Authenticate a request and return user + profile, or an error response */
export async function authenticateRequest(supabase: SupabaseClient<Database>): Promise<AuthResult> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { ok: false, error: apiError('errors.notAuthenticated', 401) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, club_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { ok: false, error: apiError('errors.profileNotFound', 403) }
  }

  return { ok: true, user, profile }
}

/** Parse a numeric query param with min/max/default */
export function parseIntParam(value: string | null, defaultVal: number, min: number, max: number): number {
  if (!value) return defaultVal
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return defaultVal
  return Math.min(Math.max(parsed, min), max)
}
