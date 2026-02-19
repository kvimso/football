'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inviteAdminSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function inviteAcademyAdmin(data: { email: string; clubId: string }) {
  // 1. Verify caller is platform_admin
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated', success: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'platform_admin') {
    return { error: 'Unauthorized', success: false }
  }

  // 2. Validate input
  const parsed = inviteAdminSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input', success: false }
  }

  const adminClient = createAdminClient()

  // 3. Verify club exists
  const { data: club, error: clubError } = await adminClient
    .from('clubs')
    .select('id, name')
    .eq('id', parsed.data.clubId)
    .single()

  if (clubError || !club) {
    return { error: 'Club not found', success: false }
  }

  // 4. Check if user already exists with this email
  const { data: existingUsers } = await adminClient.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find(u => u.email === parsed.data.email)

  if (existingUser) {
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('role, club_id')
      .eq('id', existingUser.id)
      .single()

    if (existingProfile?.role === 'academy_admin') {
      return { error: 'This user is already an academy admin', success: false }
    }

    // User exists but is a scout — promote directly
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'academy_admin', club_id: parsed.data.clubId })
      .eq('id', existingUser.id)

    if (updateError) return { error: updateError.message, success: false }

    revalidatePath('/admin/invite')
    return { success: true, message: `Existing user promoted to academy admin for ${club.name}` }
  }

  // 5. Send invitation (new user)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        role: 'academy_admin',
        club_id: parsed.data.clubId,
      },
      redirectTo: `${siteUrl}/callback?next=/admin`,
    }
  )

  if (inviteError) return { error: inviteError.message, success: false }

  revalidatePath('/admin/invite')
  return { success: true, message: `Invitation sent to ${parsed.data.email}` }
}
