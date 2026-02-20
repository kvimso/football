import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

// Service role client — bypasses RLS.
// Use ONLY in API routes and server actions, NEVER in client components.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('[supabase/admin] Missing env vars: URL=%s, SERVICE_KEY=%s', !!supabaseUrl, !!supabaseKey)
    throw new Error('Admin client configuration error. Please check environment variables.')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}
