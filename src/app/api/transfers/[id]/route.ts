import { NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiSuccess, apiError, authenticateRequest } from '@/lib/api-utils'
import { uuidSchema } from '@/lib/validations'
import { executeTransferAccept, executeTransferDecline } from '@/lib/transfer-helpers'
import { z } from 'zod'

const updateTransferSchema = z.object({
  action: z.enum(['accept', 'decline']),
})

// PATCH /api/transfers/[id] — Accept or decline a transfer request
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return apiError('errors.invalidInput', 400)

  const supabase = await createApiClient(request)
  const auth = await authenticateRequest(supabase)
  if (!auth.ok) return auth.error
  const { profile } = auth

  if (profile.role !== 'academy_admin' || !profile.club_id) {
    return apiError('errors.unauthorized', 403)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('errors.invalidInput', 400)
  }

  const parsed = updateTransferSchema.safeParse(body)
  if (!parsed.success) return apiError('errors.invalidInput', 400)

  // Fetch the transfer request
  const { data: transferRequest } = await supabase
    .from('transfer_requests')
    .select('id, player_id, from_club_id, to_club_id, status')
    .eq('id', id)
    .single()

  if (!transferRequest) return apiError('errors.requestNotFound', 404)
  if (transferRequest.from_club_id !== profile.club_id) return apiError('errors.unauthorized', 403)
  if (transferRequest.status !== 'pending') return apiError('errors.requestNoLongerPending', 400)

  if (parsed.data.action === 'accept') {
    const admin = createAdminClient()
    const result = await executeTransferAccept(admin, transferRequest.id)
    if (result.error) return apiError(result.error, 500)
    return apiSuccess({ id: transferRequest.id, status: 'accepted' }, undefined)
  }

  const result = await executeTransferDecline(supabase, transferRequest.id)
  if (result.error) return apiError(result.error, 500)
  return apiSuccess({ id: transferRequest.id, status: 'declined' }, undefined)
}
