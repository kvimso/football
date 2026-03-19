import 'server-only'

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/api-utils'
import { getPlatformAdminContext } from '@/lib/auth'
import { syncRequestSchema, MAX_PAYLOAD_SIZE } from '@/lib/camera/validations'
import { syncPlayerData, syncMatchReport, syncHeatmap } from '@/lib/camera/sync'

/**
 * POST /api/camera/sync
 *
 * Manual sync trigger for platform admins.
 * Same validation as webhook — both share syncRequestSchema.
 * Logs triggered_by: 'manual' with the admin's profile ID.
 */
export async function POST(request: NextRequest) {
  // Auth: platform_admin only
  const { error: authError, userId } = await getPlatformAdminContext()
  if (authError) {
    return apiError('errors.notAuthenticated', 401)
  }

  // Body size check
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return apiError('Payload too large', 413)
  }

  // Parse and validate body
  let body: unknown
  try {
    const text = await request.text()
    if (new TextEncoder().encode(text).length > MAX_PAYLOAD_SIZE) {
      return apiError('Payload too large', 413)
    }
    body = JSON.parse(text)
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const parsed = syncRequestSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return apiError(`Validation failed: ${issues.join('; ')}`, 400)
  }

  // Route to sync function
  const payload = parsed.data

  try {
    let result
    switch (payload.type) {
      case 'player':
        result = await syncPlayerData(payload.data, 'manual', userId)
        break
      case 'match_report':
        result = await syncMatchReport(payload.data, payload.match_id, 'manual', userId)
        break
      case 'heatmap':
        result = await syncHeatmap(payload.data, payload.match_id, 'manual', userId)
        break
    }

    return apiSuccess(result)
  } catch {
    return apiError('Sync failed', 500)
  }
}
