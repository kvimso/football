import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error(`[supabase/server] Missing env vars: URL=${!!url}, KEY=${!!key}`)
    throw new Error('Server configuration error. Please check environment variables.')
  }

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method is called from a Server Component where
          // cookies cannot be set. This can be ignored if middleware
          // refreshes user sessions.
        }
      },
    },
  })
}

/**
 * Create a Supabase client for API routes that supports both:
 * - Bearer token auth (Authorization: Bearer <token>) for programmatic access
 * - Cookie-based auth (fallback) for browser-based access
 *
 * Use this in API route handlers instead of createClient() when you want
 * to support external API consumers.
 */
export async function createApiClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Server configuration error. Please check environment variables.')
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return createSupabaseClient<Database>(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
  }

  // Fallback to cookie-based auth
  return createClient()
}
