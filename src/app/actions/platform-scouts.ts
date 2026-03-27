'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema } from '@/lib/validations'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types'

const toggleSchema = z.object({
  scoutId: uuidSchema,
  approved: z.boolean(),
})

export async function toggleScoutApproval(
  scoutId: string,
  approved: boolean
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse({ scoutId, approved })
  if (!parsed.success) return { success: false, error: 'errors.invalidInput' }

  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  // Prevent self-revocation (would lock admin out)
  if (parsed.data.scoutId === userId && !parsed.data.approved) {
    return { success: false, error: 'platform.scouts.cannotRevokeSelf' }
  }

  // Verify target is a scout (defense-in-depth)
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', parsed.data.scoutId)
    .single()

  if (targetErr || !target) {
    console.error('[platform-scouts] Profile lookup error:', targetErr?.message)
    return { success: false, error: 'errors.serverError' }
  }
  if (target.role !== 'scout') {
    return { success: false, error: 'platform.scouts.notAScout' }
  }

  // Update with role guard to close TOCTOU gap + select for row verification
  const { data: updated, error } = await admin
    .from('profiles')
    .update({ is_approved: parsed.data.approved })
    .eq('id', parsed.data.scoutId)
    .eq('role', 'scout')
    .select('id')

  if (error) {
    console.error('[platform-scouts] Toggle approval error:', error.message)
    return { success: false, error: 'errors.serverError' }
  }
  if (!updated?.length) return { success: false, error: 'platform.scouts.notFound' }

  revalidatePath('/platform/scouts')
  revalidatePath('/pending')
  return { success: true }
}
