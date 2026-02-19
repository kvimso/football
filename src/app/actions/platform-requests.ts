'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPlatformAdminContext } from '@/lib/auth'

const uuidSchema = z.string().uuid()

export async function platformApproveRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin || !userId) return { error: authErr ?? 'Unauthorized' }

  const { error } = await admin
    .from('contact_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/platform/requests')
  return { success: true }
}

export async function platformRejectRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'Invalid ID' }
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin || !userId) return { error: authErr ?? 'Unauthorized' }

  const { error } = await admin
    .from('contact_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/platform/requests')
  return { success: true }
}
