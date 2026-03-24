import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow relative paths, block protocol-relative URLs
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Backfill: link demo request to newly confirmed user
        // Uses PL/pgSQL function (JS .limit(1) on UPDATE is a PostgREST no-op)
        if (user.email) {
          try {
            const adminClient = createAdminClient()
            await adminClient.rpc('backfill_demo_request', {
              p_user_id: user.id,
              p_email: user.email,
            })
          } catch (err) {
            // Log but don't block auth flow — user can submit from /pending
            console.error('[callback] Demo request backfill error:', err)
          }
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_approved')
          .eq('id', user.id)
          .single()

        const role = profile?.role ?? 'scout'
        const isApproved = profile?.is_approved ?? false

        // Route directly based on role + approval status
        if (role === 'platform_admin') {
          return NextResponse.redirect(`${origin}/platform`)
        }
        if (role === 'academy_admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }
        // Scout: check approval
        if (!isApproved) {
          return NextResponse.redirect(`${origin}/pending`)
        }
        return NextResponse.redirect(`${origin}${safeNext}`)
      }
      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login`)
}
