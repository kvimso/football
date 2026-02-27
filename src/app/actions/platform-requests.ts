'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema, responseMessageSchema } from '@/lib/validations'

export async function platformApproveRequest(requestId: string, responseMessage?: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  if (responseMessage !== undefined) {
    const msgParsed = responseMessageSchema.safeParse(responseMessage)
    if (!msgParsed.success) return { error: msgParsed.error.issues[0]?.message ?? 'errors.invalidInput' }
  }
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin || !userId) return { error: authErr ?? 'errors.unauthorized' }

  const { error } = await admin
    .from('contact_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
      responded_by: userId,
      response_message: responseMessage?.trim() || null,
    })
    .eq('id', requestId)

  if (error) return { error: error.message }

  revalidatePath('/platform/requests')
  return { success: true }
}

export async function platformRejectRequest(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin || !userId) return { error: authErr ?? 'errors.unauthorized' }

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
