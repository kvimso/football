import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PendingPolling } from '@/components/auth/PendingPolling'
import type { Metadata } from 'next'

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

  return <PendingPolling userId={user.id} />
}
