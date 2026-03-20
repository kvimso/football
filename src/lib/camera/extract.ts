/**
 * Read-side JSONB extraction helpers for Starlive camera data.
 * Complement to transform.ts (write-side).
 *
 * Used by: match detail page, player comparison (Session 5), PDF export (Session 6).
 */

import type { Json } from '@/lib/database.types'
import type { StarliveTeamStat } from './types'

/** Cast Supabase Json to a typed object, guarding against null, primitives, and arrays. */
export function parseJsonObject<T>(json: Json | null): T | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  return json as unknown as T
}

/** Stripped-down stat shape for display (events array excluded). */
export interface TeamStatSummary {
  count: number
  accurate: number
  percent: number
  value?: number
}

/** Safe stat extraction — never throws. */
export function getTeamStat(
  teamStats: Record<string, StarliveTeamStat> | undefined,
  key: string
): TeamStatSummary {
  const stat = teamStats?.[key]
  return {
    count: stat?.count ?? 0,
    accurate: stat?.count_accurate ?? 0,
    percent: stat?.percent ?? 0,
    value: stat?.value,
  }
}

/** Extract a typed widget value from the widgets JSONB. Returns null if missing. */
export function getWidget<T>(
  widgets: Record<string, Record<string, unknown>> | null,
  teamKey: string,
  widgetName: string
): T | null {
  const teamWidgets = widgets?.[teamKey]
  if (!teamWidgets || !teamWidgets[widgetName]) return null
  return teamWidgets[widgetName] as T
}
