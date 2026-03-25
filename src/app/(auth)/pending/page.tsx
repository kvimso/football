import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PendingPolling } from '@/components/auth/PendingPolling'
import type { Metadata } from 'next'
import type { DemoRequestSummary } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Pending Approval | GFT',
}

export default async function PendingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not authenticated → login
  if (!user) redirect('/login')

  // Check if already approved — redirect to appropriate page
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_approved')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'scout'
  const isApproved = profile?.is_approved ?? false

  if (isApproved) {
    if (role === 'platform_admin') redirect('/platform')
    if (role === 'academy_admin') redirect('/admin')
    redirect('/dashboard')
  }

  // Fetch demo request status for the user (via admin client — table has REVOKE)
  let demoRequest: DemoRequestSummary | null = null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('demo_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) {
      demoRequest = data as DemoRequestSummary
    }
  } catch {
    // Non-critical — show default pending state
  }

  return <PendingPolling userId={user.id} initialDemoRequest={demoRequest} />
}
