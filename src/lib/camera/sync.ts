import 'server-only'

/**
 * Camera sync service — orchestrates Starlive data ingestion.
 *
 * Three entry points feed the same core logic:
 *   - Webhook POST (from Starlive)
 *   - Manual sync (platform_admin trigger)
 *   - Future: API poll / cron
 *
 * Uses createAdminClient() for all DB writes (bypasses RLS).
 * Each match processes independently — partial failures don't abort the sync.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/database.types'
import type {
  StarlivePlayerProfile,
  StarliveMatchReport,
  StarliveHeatmap,
  StarliveMatchIndexes,
  SyncResult,
  SyncLogInsert,
} from './types'

type MpsInsert = Database['public']['Tables']['match_player_stats']['Insert']
type SkillsInsert = Database['public']['Tables']['player_skills']['Insert']
import {
  normalizeMatchDate,
  resolveActivityId,
  extractMatchPlayerStats,
  recalculatePlayerSkills,
  extractMatchReportData,
  extractHeatmapData,
  generateCameraMatchSlug,
} from './transform'

// ============================================================
// Sync: Player Data (Source 1)
// ============================================================

export async function syncPlayerData(
  playerProfile: StarlivePlayerProfile,
  triggeredBy: 'webhook' | 'manual',
  triggeredByUser: string | null
): Promise<SyncResult> {
  const startTime = Date.now()
  // Use untyped client — sync.ts uses camera-specific tables not yet in database.types.ts
  const admin = createAdminClient()
  const starlivePlayerId = playerProfile.player_data.id
  const starliveIdStr = String(starlivePlayerId)

  // 1. Look up player in mapping table
  const { data: mapping } = await admin
    .from('starlive_player_map')
    .select('player_id, club_id')
    .eq('starlive_player_id', starlivePlayerId)
    .single()

  if (!mapping) {
    const { first_name, last_name, teams, jersey } = playerProfile.player_data
    const reason = `Unmapped player: id=${starlivePlayerId}, name=${first_name} ${last_name}, team=${teams}, jersey=${jersey.join(',')}`
    console.warn(`[camera/sync] ${reason}`)
    await logSync(admin, {
      sync_type: 'player',
      starlive_id: starliveIdStr,
      status: 'skipped' as 'failed', // skipped stored as status text
      records_synced: 0,
      records_skipped: 1,
      errors: [reason],
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
      duration_ms: Date.now() - startTime,
    })
    return { status: 'skipped', records_synced: 0, records_skipped: 1, errors: null, reason }
  }

  // Pre-fetch club mappings (one query instead of N per-match lookups)
  const { data: clubMappings } = await admin
    .from('starlive_club_map')
    .select('starlive_team_name, club_id')

  const clubMap = new Map((clubMappings ?? []).map((m) => [m.starlive_team_name, m.club_id]))

  let synced = 0
  let skipped = 0
  const errors: string[] = []

  // 2. Process each match date
  const matchDates = Object.keys(playerProfile.events)

  for (const matchDateStr of matchDates) {
    try {
      const events = playerProfile.events[matchDateStr]
      const indexes = playerProfile.indexes[matchDateStr] ?? null
      const fitness = playerProfile.fitness[matchDateStr] ?? null
      const playerStats = playerProfile.player_stats[matchDateStr] ?? null

      if (!events) {
        skipped++
        continue
      }

      // Resolve global activity ID
      const activityId = resolveActivityId(playerProfile.activities, matchDateStr)

      // Find activity for team names and match info
      const normalizedDate = normalizeMatchDate(matchDateStr)
      const activity = playerProfile.activities.find(
        (a) => normalizeMatchDate(a.activity_date) === normalizedDate
      )

      if (!activity) {
        errors.push(`No activity found for date ${matchDateStr}`)
        skipped++
        continue
      }

      // Look up club mappings for home/away teams
      const homeClubId = clubMap.get(activity.home_team__name)
      const awayClubId = clubMap.get(activity.guest_team__name)

      if (!homeClubId || !awayClubId) {
        const missing = []
        if (!homeClubId) missing.push(`home: "${activity.home_team__name}"`)
        if (!awayClubId) missing.push(`away: "${activity.guest_team__name}"`)
        errors.push(`Unmapped club(s) for ${matchDateStr}: ${missing.join(', ')}`)
        skipped++
        continue
      }

      // Find or create match
      let matchId: string | null = null

      if (activityId) {
        // Try by starlive_activity_id first
        const { data: existingMatch } = await admin
          .from('matches')
          .select('id')
          .eq('starlive_activity_id', activityId)
          .single()
        matchId = existingMatch?.id ?? null
      }

      if (!matchId) {
        // Try by match_date + clubs
        const { data: existingMatch } = await admin
          .from('matches')
          .select('id')
          .eq('home_club_id', homeClubId)
          .eq('away_club_id', awayClubId)
          .gte('match_date', `${normalizedDate}T00:00:00Z`)
          .lt('match_date', `${normalizedDate}T23:59:59Z`)
          .single()
        matchId = existingMatch?.id ?? null
      }

      if (!matchId) {
        // Create new match — need club slugs for the match slug
        const { data: homeClub } = await admin
          .from('clubs')
          .select('slug')
          .eq('id', homeClubId)
          .single()
        const { data: awayClub } = await admin
          .from('clubs')
          .select('slug')
          .eq('id', awayClubId)
          .single()

        const slug = generateCameraMatchSlug(
          homeClub?.slug ?? 'unknown',
          awayClub?.slug ?? 'unknown',
          activity.activity_date,
          activityId
        )

        const { data: newMatch, error: matchError } = await admin
          .from('matches')
          .insert({
            home_club_id: homeClubId,
            away_club_id: awayClubId,
            slug,
            match_date: activity.activity_date,
            home_score: activity.home_team_goals ?? null,
            away_score: activity.guest_team_goals,
            starlive_activity_id: activityId,
            home_team_color: activity.home_team_color,
            away_team_color: activity.guest_team_color,
            source: 'pixellot',
          })
          .select('id')
          .single()

        if (matchError || !newMatch) {
          errors.push(
            `Failed to create match for ${matchDateStr}: ${matchError?.message ?? 'unknown'}`
          )
          skipped++
          continue
        }
        matchId = newMatch.id
      }

      // matchId is guaranteed non-null here — all null paths above either assign it or continue
      if (!matchId) {
        errors.push(`Unexpected null matchId for ${matchDateStr}`)
        skipped++
        continue
      }

      // Extract and upsert match_player_stats
      const statsInsert = extractMatchPlayerStats(
        events,
        indexes,
        fitness,
        playerStats,
        matchId,
        mapping.player_id,
        starlivePlayerId
      )

      const { error: upsertError } = await admin
        .from('match_player_stats')
        .upsert(statsInsert as unknown as MpsInsert, { onConflict: 'match_id,player_id' })

      if (upsertError) {
        errors.push(`Failed to upsert stats for ${matchDateStr}: ${upsertError.message}`)
        skipped++
        continue
      }

      synced++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Error processing ${matchDateStr}: ${msg}`)
      skipped++
    }
  }

  // 3. Recalculate player_skills from ALL match indexes
  try {
    const { data: allStats } = await admin
      .from('match_player_stats')
      .select('indexes')
      .eq('player_id', mapping.player_id)
      .not('indexes', 'is', null)

    const allIndexes: StarliveMatchIndexes[] = (allStats ?? [])
      .map((s) => s.indexes as unknown as StarliveMatchIndexes)
      .filter(Boolean)

    if (allIndexes.length > 0) {
      const skills = recalculatePlayerSkills(mapping.player_id, allIndexes)
      const { error: skillsError } = await admin
        .from('player_skills')
        .upsert(skills as unknown as SkillsInsert, { onConflict: 'player_id' })

      if (skillsError) {
        errors.push(`Failed to upsert skills: ${skillsError.message}`)
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Skills recalculation failed: ${msg}`)
  }

  // 4. Log result
  const status: SyncResult['status'] =
    errors.length === 0 ? 'success' : synced > 0 ? 'partial' : 'failed'

  await logSync(admin, {
    sync_type: 'player',
    starlive_id: starliveIdStr,
    status,
    records_synced: synced,
    records_skipped: skipped,
    errors: errors.length > 0 ? errors : null,
    triggered_by: triggeredBy,
    triggered_by_user: triggeredByUser,
    duration_ms: Date.now() - startTime,
  })

  if (status === 'success') {
    return { status: 'success', records_synced: synced, records_skipped: skipped, errors: null }
  } else if (status === 'partial') {
    return { status: 'partial', records_synced: synced, records_skipped: skipped, errors }
  } else {
    return { status: 'failed', records_synced: 0, records_skipped: skipped, errors }
  }
}

// ============================================================
// Sync: Match Report (Source 3)
// ============================================================

export async function syncMatchReport(
  report: StarliveMatchReport,
  matchId: string,
  triggeredBy: 'webhook' | 'manual',
  triggeredByUser: string | null
): Promise<SyncResult> {
  const startTime = Date.now()
  const admin = createAdminClient()

  try {
    // Validate match exists
    const { data: match, error: matchError } = await admin
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      await logSync(admin, {
        sync_type: 'match_report',
        starlive_id: matchId,
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [`Match not found: ${matchId}`],
        triggered_by: triggeredBy,
        triggered_by_user: triggeredByUser,
        duration_ms: Date.now() - startTime,
      })
      return {
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [`Match not found: ${matchId}`],
      }
    }

    const reportData = extractMatchReportData(report)

    const { error: updateError } = await admin
      .from('matches')
      .update({
        team_stats: reportData.team_stats as unknown as Json,
        widgets: reportData.widgets as unknown as Json,
        intervals: reportData.intervals as unknown as Json,
        intervals_widgets: reportData.intervals_widgets as unknown as Json,
      })
      .eq('id', matchId)

    if (updateError) {
      await logSync(admin, {
        sync_type: 'match_report',
        starlive_id: matchId,
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [updateError.message],
        triggered_by: triggeredBy,
        triggered_by_user: triggeredByUser,
        duration_ms: Date.now() - startTime,
      })
      return {
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [updateError.message],
      }
    }

    await logSync(admin, {
      sync_type: 'match_report',
      starlive_id: matchId,
      status: 'success',
      records_synced: 1,
      records_skipped: 0,
      errors: null,
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
      duration_ms: Date.now() - startTime,
    })

    return { status: 'success', records_synced: 1, records_skipped: 0, errors: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await logSync(admin, {
      sync_type: 'match_report',
      starlive_id: matchId,
      status: 'failed',
      records_synced: 0,
      records_skipped: 1,
      errors: [msg],
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
      duration_ms: Date.now() - startTime,
    })
    return { status: 'failed', records_synced: 0, records_skipped: 1, errors: [msg] }
  }
}

// ============================================================
// Sync: Heatmap (Source 2)
// ============================================================

export async function syncHeatmap(
  heatmap: StarliveHeatmap,
  matchId: string,
  triggeredBy: 'webhook' | 'manual',
  triggeredByUser: string | null
): Promise<SyncResult> {
  const startTime = Date.now()
  const admin = createAdminClient()

  try {
    const extracted = extractHeatmapData(heatmap)

    if (!extracted) {
      await logSync(admin, {
        sync_type: 'heatmap',
        starlive_id: matchId,
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: ['Empty heatmap data'],
        triggered_by: triggeredBy,
        triggered_by_user: triggeredByUser,
        duration_ms: Date.now() - startTime,
      })
      return {
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: ['Empty heatmap data'],
      }
    }

    // Look up player by player key in mapping table
    // The playerKey from heatmap needs to be resolved to our player_id
    // For now, we try matching by starlive_player_id (if numeric)
    const playerKeyNum = parseInt(extracted.playerKey, 10)
    let playerId: string | null = null

    if (!isNaN(playerKeyNum)) {
      const { data: mapping } = await admin
        .from('starlive_player_map')
        .select('player_id')
        .eq('starlive_player_id', playerKeyNum)
        .single()
      playerId = mapping?.player_id ?? null
    }

    if (!playerId) {
      const reason = `Unmapped heatmap player key: "${extracted.playerKey}"`
      await logSync(admin, {
        sync_type: 'heatmap',
        starlive_id: `${matchId}:${extracted.playerKey}`,
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [reason],
        triggered_by: triggeredBy,
        triggered_by_user: triggeredByUser,
        duration_ms: Date.now() - startTime,
      })
      return { status: 'failed', records_synced: 0, records_skipped: 1, errors: [reason] }
    }

    const { error: upsertError } = await admin.from('match_heatmaps').upsert(
      {
        match_id: matchId,
        player_id: playerId,
        coords: extracted.coords,
        fps: extracted.fps,
        field_step: extracted.field_step,
      },
      { onConflict: 'match_id,player_id' }
    )

    if (upsertError) {
      await logSync(admin, {
        sync_type: 'heatmap',
        starlive_id: `${matchId}:${extracted.playerKey}`,
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [upsertError.message],
        triggered_by: triggeredBy,
        triggered_by_user: triggeredByUser,
        duration_ms: Date.now() - startTime,
      })
      return {
        status: 'failed',
        records_synced: 0,
        records_skipped: 1,
        errors: [upsertError.message],
      }
    }

    await logSync(admin, {
      sync_type: 'heatmap',
      starlive_id: `${matchId}:${extracted.playerKey}`,
      status: 'success',
      records_synced: 1,
      records_skipped: 0,
      errors: null,
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
      duration_ms: Date.now() - startTime,
    })

    return { status: 'success', records_synced: 1, records_skipped: 0, errors: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await logSync(admin, {
      sync_type: 'heatmap',
      starlive_id: matchId,
      status: 'failed',
      records_synced: 0,
      records_skipped: 1,
      errors: [msg],
      triggered_by: triggeredBy,
      triggered_by_user: triggeredByUser,
      duration_ms: Date.now() - startTime,
    })
    return { status: 'failed', records_synced: 0, records_skipped: 1, errors: [msg] }
  }
}

// ============================================================
// Sync log helper
// ============================================================

async function logSync(
  admin: ReturnType<typeof createAdminClient>,
  params: SyncLogInsert
): Promise<void> {
  const { error } = await admin.from('sync_logs').insert(params)
  if (error) {
    console.error('[camera/sync] Failed to write sync log:', error.message)
  }
}
