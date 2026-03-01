'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema } from '@/lib/validations'
import { executeTransferAccept, executeTransferDecline } from '@/lib/transfer-helpers'

export async function platformAcceptTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { data: request, error: fetchErr } = await admin
    .from('transfer_requests')
    .select('id, player_id, from_club_id, to_club_id, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'errors.requestNotFound' }
  if (request.status !== 'pending') return { error: 'errors.requestNoLongerPending' }

  const result = await executeTransferAccept(admin, request.id)
  if (result.error) return { error: result.error }

  revalidatePath('/platform/transfers')
  revalidatePath('/platform/players')
  revalidatePath('/players')
  return { success: true }
}

export async function platformDeclineTransfer(requestId: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  const { data: request, error: fetchErr } = await admin
    .from('transfer_requests')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) return { error: 'errors.requestNotFound' }
  if (request.status !== 'pending') return { error: 'errors.requestNoLongerPending' }

  const result = await executeTransferDecline(admin, requestId)
  if (result.error) return { error: result.error }

  revalidatePath('/platform/transfers')
  return { success: true }
}
