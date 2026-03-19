import 'server-only'

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { apiSuccess, apiError } from '@/lib/api-utils'
import { syncRequestSchema, MAX_PAYLOAD_SIZE } from '@/lib/camera/validations'
import { syncPlayerData, syncMatchReport, syncHeatmap } from '@/lib/camera/sync'
import type {
  StarlivePlayerProfile,
  StarliveMatchReport,
  StarliveHeatmap,
} from '@/lib/camera/types'

/**
 * POST /api/camera/webhook
 *
 * Receives push data from Starlive's Pixellot system.
 * Auth: Bearer token checked against PIXELLOT_WEBHOOK_SECRET.
 * If secret is not configured, endpoint returns 404 (avoids retry storms).
 */
export async function POST(request: NextRequest) {
  // Check if webhook secret is configured
  const webhookSecret = process.env.PIXELLOT_WEBHOOK_SECRET
  if (!webhookSecret) {
    return apiError('Not found', 404)
  }

  // Body size check (10MB max)
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return apiError('Payload too large', 413)
  }

  // Auth: Bearer token with timing-safe comparison
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError('Unauthorized', 401)
  }

  const token = authHeader.slice(7) // Remove "Bearer "
  const tokenBuffer = Buffer.from(token)
  const secretBuffer = Buffer.from(webhookSecret)

  if (
    tokenBuffer.length !== secretBuffer.length ||
    !crypto.timingSafeEqual(tokenBuffer, secretBuffer)
  ) {
    return apiError('Unauthorized', 401)
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
    return apiError('Invalid payload structure', 400)
  }

  // Route to sync function
  const payload = parsed.data

  try {
    let result
    switch (payload.type) {
      case 'player':
        result = await syncPlayerData(payload.data as StarlivePlayerProfile, 'webhook', null)
        break
      case 'match_report':
        result = await syncMatchReport(
          payload.data as StarliveMatchReport,
          payload.match_id,
          'webhook',
          null
        )
        break
      case 'heatmap':
        result = await syncHeatmap(
          payload.data as StarliveHeatmap,
          payload.match_id,
          'webhook',
          null
        )
        break
    }

    if (result.status === 'success') {
      return apiSuccess({ status: 'ok', synced: result.records_synced })
    } else if (result.status === 'partial') {
      return apiSuccess({
        status: 'partial',
        synced: result.records_synced,
        skipped: result.records_skipped,
      })
    } else {
      // failed or skipped — return 200 to prevent webhook retries
      return apiSuccess({
        status: result.status,
        synced: 0,
        skipped: result.records_skipped,
      })
    }
  } catch {
    // Never leak internal error details
    return apiError('Internal error', 500)
  }
}
