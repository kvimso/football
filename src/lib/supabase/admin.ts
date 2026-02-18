import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS.
// Use ONLY in API routes and server actions, NEVER in client components.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
