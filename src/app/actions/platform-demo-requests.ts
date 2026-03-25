'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema } from '@/lib/validations'
import { DEMO_STATUSES } from '@/lib/constants'
import { z } from 'zod'

const statusSchema = z.enum(DEMO_STATUSES)

export async function updateDemoRequestStatus(requestId: string, newStatus: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const parsedStatus = statusSchema.safeParse(newStatus)
  if (!parsedStatus.success) return { error: 'errors.invalidInput' }

  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { data: updated, error } = await admin
    .from('demo_requests')
    .update({ status: parsedStatus.data })
    .eq('id', requestId)
    .select('id, user_id, status')

  if (error) {
    console.error('[platform-demo-requests] Status update error:', error.message)
    return { error: 'errors.serverError' }
  }
  if (!updated?.length) return { error: 'demo.notFound' }

  // Auto-approve: when converting AND user is linked, approve their scout account
  // MUST use admin client — is_approved column excluded from column-level GRANT (migration 044)
  if (parsedStatus.data === 'converted' && updated[0].user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', updated[0].user_id)
      .single()

    if (profile?.role === 'scout') {
      await admin.from('profiles').update({ is_approved: true }).eq('id', updated[0].user_id)
    }
  }

  revalidatePath('/platform/demo-requests')
  revalidatePath('/platform/scouts')
  return { success: true }
}
