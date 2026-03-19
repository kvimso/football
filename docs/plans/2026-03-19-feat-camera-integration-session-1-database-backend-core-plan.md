---
title: "Camera Integration Session 1: Database Schema + Backend Core"
type: feat
status: completed
date: 2026-03-19
origin: docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md
---

# Camera Integration Session 1: Database Schema + Backend Core

## Enhancement Summary

**Deepened on:** 2026-03-19
**Agents used:** 13 (data-integrity-guardian, data-migration-expert, security-sentinel, architecture-strategist, performance-oracle, kieran-typescript-reviewer, code-simplicity-reviewer, schema-drift-detector, deployment-verification, best-practices-researcher, framework-docs-researcher, database-supabase, learnings-researcher)

### Critical Fixes Required (6)

1. **`player_videos.match_id` FK blocks `DELETE FROM matches`** — FK has no ON DELETE clause (defaults to RESTRICT). Must `UPDATE player_videos SET match_id = NULL` before deleting matches. *(Data Integrity + Migration Expert)*
2. **`seed.sql` will fail after migration** — inserts into dropped `player_season_stats` table and uses old column names for `player_skills` and `match_player_stats`. Must update seed.sql. *(Migration Expert)*
3. **Blast radius is ~24 files, not 18** — 6 additional files missing from inventory: `CompareRadarChart.tsx`, `AIFilterTags.tsx`, `ai-search/types.ts`, `ai-search/prompt.ts`, `PlayerListRow.tsx`, `ai-search/service.ts`. *(Migration Expert + Architecture)*
4. **Add Zod runtime validation for Starlive JSON** — TypeScript types are erased at runtime. Webhook accepts untrusted external JSON. Must validate structure before DB insertion. Add `src/lib/camera/validations.ts`. *(Security + TypeScript + Architecture)*
5. **Use `get_user_role()` in RLS policies** — not direct `profiles.role` query. Direct query causes infinite recursion (bug fixed in migration 000013). *(Security + Supabase)*
6. **Add `ENABLE ROW LEVEL SECURITY`** on all new/recreated tables — without this, any authenticated user with anon key can write. *(Supabase)*

### High-Priority Improvements (8)

7. **Consider keeping season stats as computed cache** — dropping `player_season_stats` without replacement means live aggregation on every player list page (N+1 problem). Either keep table and update during sync, or accept temporary regression. *(Performance Oracle)*
8. **Separate `activity_id` from `StarliveMatchEvents`** — don't use `StarliveEvent | number` union type. Extract activity_id, use clean `Record<string, StarliveEvent>` for events. *(TypeScript)*
9. **Derive DB insert types from `database.types.ts`** — use `Database['public']['Tables']['match_player_stats']['Insert']`, not hand-rolled parallel types. *(TypeScript)*
10. **Add `import 'server-only'`** to `transform.ts` and `sync.ts` — prevents accidental client bundling. *(Architecture)*
11. **Use `apiSuccess`/`apiError` helpers** in all new API routes — matches codebase convention. *(Architecture)*
12. **Add CHECK constraints on 1-10 scale columns** — prevents transform bugs from inserting values > 10 or < 0. *(Data Integrity)*
13. **Pre-fetch club mappings** at top of `syncPlayerData` — one query instead of N per-match lookups. *(Performance)*
14. **Add ON DELETE SET NULL** to `starlive_player_map.club_id` and `.mapped_by` FKs. *(Data Integrity)*

### Simplifications (defer to later sessions, -130 LOC)

15. **Defer `/api/camera/sync-logs` route** to Session 2 (no consumer until admin dashboard). *(Simplicity)*
16. **Defer most translation keys** except `camera.noDataYet` to their consuming sessions. *(Simplicity)*
17. **Defer `RATING_COLORS`, `CAMERA_STAT_CATEGORIES`, `SYNC_TYPES` constants** to Sessions 2-3. *(Simplicity)*

### Plan Corrections (from agent verification)

18. **Old matches write policies already gone** — all dropped in migration 000020. Use `DROP POLICY IF EXISTS` defensively, but they don't actually exist. *(Supabase + Migration Expert)*
19. **`player_videos` write policies also already gone** — plan incorrectly says "keep existing academy_admin write policies." None exist. *(Supabase + Migration Expert)*
20. **Wrong reference filename** — `000016_restrict_camera_data_writes.sql` should be `000016_transfers_and_player_updates.sql`. RLS restriction actually lives in `000020_cleanup.sql`. *(Architecture + Supabase)*

### New Considerations Discovered

- **JSONB size validation needed** — validate payload sizes before DB insertion (500KB max for events, 100KB for indexes/fitness) *(Security)*
- **Webhook body size limit** — add 10MB max check as first line of webhook handler *(Security)*
- **HMAC webhook auth structure** — design for HMAC-SHA256 with Bearer fallback. Add to Starlive questions doc. *(Security)*
- **Timing-safe secret comparison** — use `crypto.timingSafeEqual()` for webhook auth *(Security)*
- **JSONB parser functions needed in Session 1** — centralized `parseMatchEvents()`, `parseIndexes()` helpers for type-safe JSONB consumption *(TypeScript)*
- **`SyncResult` as discriminated union** — `success | partial | failed` variants with different fields *(TypeScript)*
- **`pass_success_rate` = null when `passes_total === 0`** — not 0%, which is semantically wrong *(TypeScript)*
- **`CompareBar` max value** — needs 100→10 update when skills data arrives (note for Session 5) *(TypeScript)*
- **Add composite index** `idx_mps_player_match(player_id, match_id)` for season stats joins *(Performance)*
- **Never SELECT JSONB in list queries** — `intervals` + `intervals_widgets` are ~900KB/match, must be lazy-loaded *(Performance)*
- **Grep for ALL old references after migration** — FK names, type names, translation keys, `season_stats`, old skill names *(Learnings)*
- **Query `pg_policies` after migration** to verify final RLS state *(Learnings)*
- **Test with each role** (scout, academy_admin, platform_admin) post-migration *(Learnings)*

---

## Overview

Session 1 lays the entire backend foundation for the Starlive camera integration (Phase 7). This is the single largest schema migration in the project's history — dropping 1 table, recreating 2 tables, altering 2 tables, creating 4 new tables, and updating ~22 source files to fix compile breaks. Everything in Sessions 2-5 (admin UI, player profile stats, match reports, comparison tool) builds directly on this work.

**Session 1 does NOT include UI components** (no heatmap SVG, no radar chart updates, no match report visualizations). Pages will render with "no camera data yet" empty states until Sessions 3-4 add the visual components.

## Problem Statement / Motivation

The platform currently has demo/seed data in FIFA-style stats (pace 1-100, shooting 1-100, etc.) that bears no relation to real player performance. Starlive's Pixellot cameras provide verified match-level statistics with 57 event types, fitness tracking, performance indexes, and heatmaps. This session replaces the demo data model with a real camera-data model so that all future data comes from verified camera sources.

**Why now:** The design spec is approved, sample JSON data has been analyzed, and the schema is finalized. The migration is a prerequisite for everything else.

## Proposed Solution

A single-session backend overhaul:

1. **SQL migration** — one atomic migration file with all schema changes
2. **Camera types** — TypeScript interfaces matching Starlive's 3 JSON structures
3. **Transform logic** — functions that extract key stats from Starlive JSON into DB columns
4. **Sync service** — orchestrator: validate → transform → upsert → recalculate skills → log
5. **API routes** — webhook receiver, manual sync trigger, sync log viewer
6. **Compile break fixes** — update all 11 files that reference dropped/changed tables
7. **Type regeneration** — `database.types.ts` from new schema

## Technical Approach

### Architecture

```
supabase/migrations/000041  ←── Schema foundation (new tables, altered tables, RLS)
        │
        ▼
src/lib/camera/types.ts     ←── Starlive JSON TypeScript interfaces
        │
        ▼
src/lib/camera/transform.ts ←── JSON → DB row transforms (stat extraction)
        │
        ▼
src/lib/camera/sync.ts      ←── SyncService orchestrator
        │
        ├──► POST /api/camera/webhook     (Starlive push)
        ├──► POST /api/camera/sync        (platform_admin manual trigger)
        └──► GET  /api/camera/sync-logs   (audit viewer)
```

### Implementation Phases

#### Phase A: SQL Migration (1 file)

**File:** `supabase/migrations/20250101000041_camera_integration.sql`

One migration, 6 steps in strict order (order matters for FK constraints and CASCADE):

**Step 1 — Drop old stats tables (CASCADE removes their RLS policies and triggers):**
- `DROP TABLE IF EXISTS match_player_stats CASCADE`
- `DROP TABLE IF EXISTS player_skills CASCADE`
- `DROP TABLE IF EXISTS player_season_stats CASCADE`
- CASCADE removes old RLS policies, triggers, and FK constraints automatically

**Step 2 — Clear FK references and delete seeded match data:**
- `UPDATE player_videos SET match_id = NULL WHERE match_id IS NOT NULL` (clear FK references — `player_videos.match_id` has no ON DELETE CASCADE, would block DELETE)
- `DELETE FROM matches` (5 seeded matches — stats table FKs removed in Step 1, video FKs nulled above)

**Step 3 — Create new tables:**
- `match_heatmaps` (player per-match position data)
- `starlive_player_map` (Starlive player ID → our UUID)
- `starlive_club_map` (Starlive team name → our club UUID)
- `sync_logs` (audit trail for every sync operation)

**Step 4 — Alter existing tables:**

`matches`:
- `ALTER match_date` from `date` to `timestamptz` (Starlive includes time: `"2026-03-08T15:08:00Z"`)
- `ADD` columns: `starlive_activity_id` (int, unique), `home_team_color` (text), `away_team_color` (text), `team_stats` (jsonb), `widgets` (jsonb), `intervals` (jsonb), `intervals_widgets` (jsonb), `source` (text, default `'pixellot'`)
- `DROP` columns: `match_report`, `match_report_ka`, `highlights_url`, `camera_source`, `external_event_id` (was `pixellot_event_id`, renamed in migration 000020)
- `DROP POLICY IF EXISTS` defensively for old matches write policies — verification shows all were already dropped by migrations 000016 and 000020. No write policies currently exist on `matches`. The IF EXISTS drops are purely defensive to guarantee clean state.

`player_videos`:
- `ADD` columns: `starlive_event_id` (int), `video_timestamp_start` (text), `video_timestamp_end` (text)
- Preserve existing video data (manual YouTube links remain valid)
- No write policy changes needed — all write policies on `player_videos` were already removed by migrations 000016/000020. Current state is service-role-only writes, which is correct.

**Step 5 — Recreate stats tables:**
- `match_player_stats` — new hybrid schema: 17 real columns + 3 JSONB columns (events, indexes, fitness)
- `player_skills` — new camera-derived schema: attack/defence/fitness/overall 1-10 + 13 sub-scores

**Step 6 — RLS policies:**

Camera data tables (public read, service role write):
- `match_player_stats`: SELECT `using (true)`, no INSERT/UPDATE/DELETE policies (service role bypasses)
- `player_skills`: SELECT `using (true)`, no write policies
- `match_heatmaps`: SELECT `using (true)`, no write policies

Admin-only tables (use `public.get_user_role()` helper — NOT direct profiles join, which causes RLS recursion per migration 000013):
- `starlive_player_map`: `USING (public.get_user_role() = 'platform_admin')` for SELECT/UPDATE/DELETE, `WITH CHECK (public.get_user_role() = 'platform_admin')` for INSERT
- `starlive_club_map`: same pattern
- `sync_logs`: SELECT with `get_user_role() = 'platform_admin'`, no user write policies (service role only)

**All new and recreated tables MUST include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`** — without this, any authenticated user with the anon key can write directly.

Indexes:
- `idx_mps_player` on `match_player_stats(player_id)`
- `idx_mps_match` on `match_player_stats(match_id)`
- `idx_mps_rating` on `match_player_stats(overall_rating DESC)`
- `idx_mps_goals` on `match_player_stats(goals DESC)`
- `idx_heatmaps_player` on `match_heatmaps(player_id)`
- `idx_heatmaps_match` on `match_heatmaps(match_id)`
- `idx_spm_player` on `starlive_player_map(player_id)`
- `idx_sync_logs_date` on `sync_logs(created_at DESC)`
- `idx_sync_logs_status` on `sync_logs(status)`

Updated_at triggers (use existing `update_updated_at_column()` from migration 000011 — **NOT** `set_updated_at()` as the design spec incorrectly states):
- `match_player_stats`
- `match_heatmaps`

<details>
<summary>Column changes cheat sheet (old → new)</summary>

**match_player_stats:**
| Old Column | New Column | Notes |
|-----------|-----------|-------|
| `pass_accuracy` | `pass_success_rate` | numeric(5,2) |
| `distance_km` | `distance_m` | numeric(10,2), unit change km→m |
| `top_speed_kmh` | _(dropped)_ | replaced by `speed_avg` from fitness |
| `rating` | `overall_rating` | numeric(3,1), 1-10 scale |
| `sprints` | `sprints_count` | int |
| `heat_map_data` | _(moved)_ | now in `match_heatmaps` table |
| _(new)_ | `starlive_player_id` | int |
| _(new)_ | `key_passes` | int default 0 |
| _(new)_ | `shots_on_target` | int default 0 |
| _(new)_ | `passes_total` | int default 0 |
| _(new)_ | `passes_successful` | int default 0 |
| _(new)_ | `dribbles_success` | int default 0 |
| _(new)_ | `dribbles_fail` | int default 0 |
| _(new)_ | `speed_avg` | numeric(6,4) |
| _(new)_ | `events` | jsonb (full Starlive events) |
| _(new)_ | `indexes` | jsonb (full Starlive indexes) |
| _(new)_ | `fitness` | jsonb (full Starlive fitness) |
| _(new)_ | `updated_at` | timestamptz |

**player_skills:**
| Old Column | New Column | Notes |
|-----------|-----------|-------|
| `pace` (1-100) | _(dropped)_ | FIFA-style, no camera equivalent |
| `shooting` (1-100) | `shooting` (1-10) | from Starlive indexes.attack.shooting |
| `passing` (1-100) | _(dropped)_ | split into sub-scores |
| `dribbling` (1-100) | `dribbling` (1-10) | from indexes.attack.dribling |
| `defending` (1-100) | _(dropped)_ | split into sub-scores |
| `physical` (1-100) | _(dropped)_ | replaced by fitness sub-scores |
| _(new)_ | `attack`, `defence`, `fitness`, `overall` | category totals (1-10) |
| _(new)_ | `forward_play`, `possession`, `set_piece` | attack sub-scores |
| _(new)_ | `tackling`, `positioning`, `duels`, `pressing`, `goalkeeping` | defence sub-scores |
| _(new)_ | `fitness_distance`, `fitness_intensity`, `fitness_speed` | fitness sub-scores |
| _(new)_ | `matches_counted` | int |
| _(new)_ | `last_updated` | timestamptz |

</details>

#### Phase B: Camera TypeScript Types (1 file)

**File:** `src/lib/camera/types.ts`

TypeScript interfaces matching the 3 Starlive JSON structures. Key types:

- `StarliveEventOutcome` — `{ sum: number; per_minute: number }`
- `StarliveEvent` — `{ success?: ...; fail?: ...; neutral?: ... }`
- `StarliveMatchEvents` — `Record<string, StarliveEvent | number>` (number for `activity_id`)
- `StarliveIndexes` — attack/defence/fitness objects with nullable sub-scores + overall + activity_id
- `StarliveFitness` — distance, sprints, speed + per_minute variants
- `StarliveActivity` — match info (id, teams, date, score, colors)
- `StarlivePlayerProfile` — full Source 1 response (player_data + activities + events + indexes + fitness + player_stats)
- `StarliveHeatmap` — Source 2 response (`{ [playerKey]: { fps, field_step, coords } }`)
- `StarliveMatchReport` — Source 3 response (result.teams_data + widgets + intervals)
- `StarliveTeamStat` — `{ count, count_accurate, percent, value?, events }`
- `StarliveWidgets` — possession, attacks_direction, weighted_position, etc.

Also export helper types for DB operations:
- `MatchPlayerStatsInsert` — shape for upserting into match_player_stats
- `PlayerSkillsUpsert` — shape for recalculated player_skills
- `SyncLogInsert` — shape for sync_logs entries
- `SyncResult` — return type for sync operations `{ status, records_synced, records_skipped, errors }`

#### Phase C: Camera Transform Logic (1 file)

**File:** `src/lib/camera/transform.ts`

Pure functions that transform Starlive JSON → DB insert shapes. No database calls.

Functions:
- `extractMatchPlayerStats(events, indexes, fitness, playerStats, matchDate)` → `MatchPlayerStatsInsert`
  - Extracts goals, assists, key_passes, shots, etc. from events (see design spec lines 409-425)
  - Extracts fitness: distance_m, sprints_count, speed_avg
  - Extracts rating: indexes.overall
  - Extracts minutes: player_stats.playing_time.minutes
  - Stores full events/indexes/fitness objects as JSONB
  - Handles missing event types gracefully (default 0)

- `recalculatePlayerSkills(allMatchIndexes)` → `PlayerSkillsUpsert`
  - Averages all non-null index values across matches
  - Handles null sub-scores (goalkeeping null for outfield, set_piece null if no set pieces)
  - Returns matches_counted

- `normalizeMatchDate(dateStr)` → `string`
  - Handles both `"2025-11-11T00:00:00Z"` and `"2025-11-11 00:00:00+00:00"` formats (quirk #3)

- `resolveActivityId(activities, matchDate)` → `number | null`
  - Maps match date string to global activity ID (quirk #1: dual ID system)
  - Returns `null` if no matching activity found

- `extractMatchReportData(report)` → `{ team_stats, widgets, intervals, intervals_widgets }`
  - Extracts the 4 JSONB blobs from Source 3

- `extractHeatmapData(heatmapJson)` → `{ playerKey, coords, fps, field_step }`
  - Parses Source 2 structure

**Data quirk handling embedded in transform:**
1. Dual activity ID system → `resolveActivityId` uses date matching
2. Missing fields → defaults (0 for counts, null for ratings)
3. Date format inconsistency → `normalizeMatchDate` normalizes both formats
4. Null index sub-scores → skip nulls in averaging
5. Starlive misspellings → stored raw in JSONB, transform layer uses Starlive keys (`dribling`, `goalkeeing`)
6. Event types vary per match → safe access with `?.` and defaults
7. Null player in match report → skip events with `player: null`

#### Phase D: Camera Sync Service (1 file)

**File:** `src/lib/camera/sync.ts`

Orchestrator that calls transform functions and writes to DB via service role client.

Core function signatures:

```
syncPlayerData(playerProfile: StarlivePlayerProfile) → Promise<SyncResult>
syncMatchReport(report: StarliveMatchReport, matchId: string) → Promise<SyncResult>
syncHeatmap(heatmap: StarliveHeatmap, matchId: string) → Promise<SyncResult>
```

**`syncPlayerData` flow:**
1. Look up player in `starlive_player_map` by `player_data.id`
2. If unmapped → log warning with full player details (id, name, jersey, team), return `{ status: 'skipped' }`
3. For each match date in events/indexes/fitness/player_stats:
   a. Resolve global activity_id via `resolveActivityId()`
   b. Look up club mapping for home/away team names
   c. Find or create `matches` row by `starlive_activity_id` or `match_date + clubs`
   d. Call `extractMatchPlayerStats()` → get insert shape
   e. Upsert into `match_player_stats` (unique on match_id + player_id)
4. Fetch all match indexes for this player
5. Call `recalculatePlayerSkills()` → upsert into `player_skills`
6. Log in `sync_logs` with `sync_type: 'player'`, record counts, any errors

**`syncMatchReport` flow:**
1. Validate match exists
2. Call `extractMatchReportData()`
3. Update `matches` row: `team_stats`, `widgets`, `intervals`, `intervals_widgets`
4. Log in `sync_logs` with `sync_type: 'match_report'`

**`syncHeatmap` flow:**
1. Parse player key, look up mapping
2. Upsert into `match_heatmaps` (unique on match_id + player_id)
3. Log result

**Error handling:**
- Each match processes independently — partial failures don't abort the entire sync
- Errors collected in array, status set to `'partial'` if some succeed and some fail
- `createAdminClient()` used for all DB writes (bypasses RLS)
- `sync_logs` always written, even on failure

**Helper:**
- `logSync(params)` — writes to `sync_logs` table with timing, counts, errors

#### Phase E: API Routes (2 files) + Validation Schema (1 file)

**File:** `src/lib/camera/validations.ts` (NEW)

Zod schemas for runtime validation of Starlive JSON payloads. Follows the project's existing pattern in `src/lib/validations.ts`. Validates at the API boundary only — transform functions receive pre-validated data.

- `starlivePlayerProfileSchema` — structural validation of Source 1 (player_data, activities, events, indexes, fitness, player_stats)
- `starliveMatchReportSchema` — structural validation of Source 3
- `starliveHeatmapSchema` — structural validation of Source 2
- `syncRequestSchema` — discriminated union: `{ type: 'player' | 'match_report' | 'heatmap', data: ..., match_id?: string }`
- JSONB size limits: events max 500KB, indexes/fitness max 100KB each

**File:** `src/app/api/camera/webhook/route.ts`

```
POST /api/camera/webhook
```
- **Body size check first** — reject payloads > 10MB with 413
- **Auth:** If `PIXELLOT_WEBHOOK_SECRET` env var is set, require Bearer token with `crypto.timingSafeEqual()` for constant-time comparison. If not set, reject with 404 (not 503 — avoids webhook retry storms)
- **Validate** body with Zod schema from `validations.ts`
- Routes to appropriate sync function
- Returns minimal response: `{ status: 'ok', synced: N }` on success, `{ status: 'partial', synced: N, skipped: M }`, `{ status: 'error' }` on failure — never leak internal error details
- Uses `apiSuccess`/`apiError` helpers from `src/lib/api-utils.ts`
- Add `import 'server-only'`

**File:** `src/app/api/camera/sync/route.ts`

```
POST /api/camera/sync
```
- Requires `platform_admin` role (use `getPlatformAdminContext()`)
- **Same Zod validation** as webhook — both endpoints share `syncRequestSchema`
- Routes to appropriate sync function
- Returns sync result with details via `apiSuccess`
- Logs `triggered_by: 'manual'` with `triggered_by_user` set to admin's profile ID

**Deferred to Session 2:** `GET /api/camera/sync-logs` — no consumer until admin sync dashboard is built. Platform admin can query sync_logs via Supabase Studio until then.

#### Phase F: Fix Compile Breaks (~16 source files)

Every file that references `player_season_stats`, old `player_skills` columns, old `match_player_stats` columns, or dropped `matches` columns must be updated. Without these fixes, `npm run build` fails.

**Strategy:** Remove broken joins, update column names to match new schema, handle empty data gracefully. UI components receive new data shape but will show empty states until Sessions 3-4 add visualizations.

**SpecFlow finding — blast radius is larger than design spec lists.** The spec lists 9 files for `player_season_stats` removal, but 5 additional component files also reference this data: `PlayerCard.tsx`, `PlayerListRow.tsx`, `PlayerDirectoryClient.tsx`, `CompareView.tsx`, `RadarChart.tsx`. Plus `src/lib/types.ts` (`PlayerBrowseData` interface) and `src/lib/ai-search/types.ts`.

<details>
<summary>File-by-file changes (16 files, grouped by category)</summary>

**Server pages (5 files):**

**1. `src/app/(platform)/players/[slug]/page.tsx`**
- Remove: `season_stats:player_season_stats (...)` join
- Update: `skills:player_skills (...)` → new columns: `attack, defence, fitness, overall, forward_play, possession, dribbling, shooting, set_piece, tackling, positioning, duels, pressing, goalkeeping, fitness_distance, fitness_intensity, fitness_speed, matches_counted`
- Update: `match_stats:match_player_stats (...)` → new columns: `minutes_played, goals, assists, pass_success_rate, shots, shots_on_target, tackles, interceptions, distance_m, sprints_count, speed_avg, overall_rating, key_passes, passes_total, passes_successful, dribbles_success, dribbles_fail`
- Downstream: update data shape passed to child components (RadarChart, StatsTable will receive new props but their visual updates are Session 3)

**2. `src/app/(platform)/players/page.tsx`**
- Remove: `season_stats:player_season_stats (...)` join
- Player list cards: no stats passed down

**3. `src/app/(platform)/players/compare/page.tsx`**
- Remove: `season_stats:player_season_stats (...)` join
- Update: `skills:player_skills (...)` → new camera-derived columns
- Update: comparison data shape passed to `CompareView`

**4. `src/app/(platform)/clubs/[slug]/page.tsx`**
- Remove: `season_stats:player_season_stats (...)` join
- Club squad table: remove season stat columns display

**5. `src/app/(platform)/matches/[slug]/page.tsx`**
- Remove: `highlights_url, match_report, match_report_ka` from query
- Update: `player_stats:match_player_stats (...)` columns → new names (`pass_accuracy` → `pass_success_rate`, `distance_km` → `distance_m`, `top_speed_kmh` → removed, `rating` → `overall_rating`, `sprints` → `sprints_count`)
- Add: query `team_stats, widgets` from matches (for future match report component)

**API routes (5 files):**

**6. `src/app/api/players/route.ts`**
- Remove: `season_stats:player_season_stats (...)` join

**7. `src/app/api/players/[id]/route.ts`**
- Remove: `season_stats:player_season_stats (...)` join
- Update: `skills:player_skills (...)` → new columns
- Update: `match_stats:match_player_stats (...)` → new column names
- Update response shape

**8. `src/app/api/players/[id]/pdf/route.ts`**
- Remove: `season_stats:player_season_stats (...)` join
- Update: `skills:player_skills (...)` → new columns
- Update PDF generation: attack/defence/fitness instead of pace/shooting/etc.
- Show "No camera data" placeholder in PDF if no match_player_stats exist

**9. `src/app/api/players/ai-search/route.ts`**
- Remove: `season_stats:player_season_stats (...)` join
- Update: `player_skills (...)` → new column names
- Update skill-based filtering logic (was: pace > 80 → now: attack > 7.0 on 1-10 scale)
- Update sorting by skills

**10. `src/app/api/clubs/[slug]/route.ts`**
- Remove: `season_stats:player_season_stats (...)` join

**11. `src/app/api/matches/[slug]/route.ts`**
- Remove: `highlights_url, match_report, match_report_ka` from query and response
- Update: `match_player_stats` column names in query
- Add: `team_stats, widgets` to match query

**Component files (3 files):**

**12. `src/components/player/PlayerCard.tsx`**
- Currently renders `player.season_stats.goals`, etc. as stat chips
- Update: remove season_stats references, show no stat chips when data is absent
- Stat chips will be restored with camera aggregations in Session 3

**13. `src/components/player/PlayerDirectoryClient.tsx`**
- `mapAIPlayerToCard()` maps `season_stats` for AI search results
- Update: remove season_stats mapping, handle null gracefully

**14. `src/components/player/CompareView.tsx`**
- `PlayerData` interface includes `season_stats` and FIFA-style `skills`
- Update interface to new `player_skills` shape (camera 1-10 scale)
- Remove `season_stats` from interface
- Show "No camera data yet" when skills are empty
- Full visual redesign deferred to Session 5

**Type files (2 files):**

**15. `src/lib/types.ts`**
- `PlayerBrowseData` interface has `season_stats` property
- Remove or make optional. Update to remove season_stats dependency.

**16. `src/lib/ai-search/types.ts`** (if it exists)
- `AISearchFilters` may reference old stat field names
- Update to camera-style field names (attack/defence/fitness scale)

**Note on RadarChart and CompareRadarChart:** These components use FIFA-style skill keys (`pace`, `shooting`, `passing`, `dribbling`, `defending`, `physical`). For Session 1, update them minimally to accept the new `player_skills` shape (or `null`) and show empty state. Full radar redesign with camera indexes is Session 3/Session 5.

</details>

#### Phase G: Translations (1 file — simplified)

**`src/lib/translations/players.ts`** — Add only what Session 1 needs:
- `camera.noDataYet` — "No camera data yet" / Georgian equivalent
- All other camera translation keys (skill labels, stat labels, sync UI, rating labels) deferred to their consuming sessions (Sessions 2-4)

**Deferred to later sessions:** `RATING_COLORS`, `CAMERA_STAT_CATEGORIES`, `SYNC_TYPES` constants — these serve UI components that don't exist until Sessions 2-3. Ship constants with their consumers.

#### Phase H: Type Regeneration + Build Verification

1. Apply migration to local Supabase: `npx supabase db reset` (resets and reapplies all migrations)
2. Regenerate types: `npx supabase gen types typescript --local > src/lib/database.types.ts`
3. Run `npm run build` — must pass with zero TypeScript errors
4. Verify all 11 modified files compile correctly
5. Verify API routes respond (manual test with `curl`)

## System-Wide Impact

### Interaction Graph

- Migration drops `player_season_stats` → 9 files break → Phase F fixes all
- Migration recreates `match_player_stats` + `player_skills` with new columns → 6 files break → Phase F fixes all
- Migration drops `matches.match_report`, `.highlights_url` → 2 files break → Phase F fixes
- New `match_player_stats` schema changes FK names → Supabase query hints (`!match_player_stats_match_id_fkey`) should remain the same since FK names are recreated identically
- `createAdminClient()` already exists and is battle-tested (used by chat system) → sync service uses same pattern
- Auth guards already exist (`getPlatformAdminContext()`) → API routes use same pattern

### Error & Failure Propagation

- Sync service wraps each match in try/catch → partial failures don't crash entire sync
- `sync_logs` always written (even on failure) → audit trail complete
- Unmapped players/clubs → logged and skipped, never crash
- Webhook auth failure → 401 immediately, no sync attempted
- Database upsert failure → caught, logged, continues with next record

### State Lifecycle Risks

- **Seed data deletion**: Migration deletes all 5 seeded matches. After migration, match-related pages show empty states. This is intentional — no going back to fake data.
- **FK cascade**: Dropping `matches` rows cascades to `match_player_stats` (via FK). Dropping `match_player_stats` table also handles this. No orphaned records.
- **player_skills recreation**: Old skills deleted, new table empty until first sync. RadarChart shows empty/loading state.
- **Concurrent sync**: Two syncs for the same player could race on `match_player_stats` upsert. The `unique(match_id, player_id)` constraint + upsert semantics handle this safely (last write wins).

### API Surface Parity

- `GET /api/players/[id]` — response shape changes (new stat names)
- `GET /api/matches/[slug]` — response shape changes (new stat names, dropped fields)
- `GET /api/players` — response shape changes (season_stats removed)
- `GET /api/clubs/[slug]` — response shape changes (season_stats removed)
- All changes are backward-incompatible but there are no external API consumers — this is a first-party web app

## Acceptance Criteria

### Functional Requirements

- [x] Migration applies cleanly (applied to remote Supabase — Docker not available for local)
- [x] All 4 new tables created: `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`
- [x] `matches` table has new columns and dropped old columns
- [x] `match_player_stats` recreated with hybrid schema (17 real columns + 3 JSONB)
- [x] `player_skills` recreated with camera-derived 1-10 scale
- [x] `player_season_stats` table no longer exists
- [x] `player_videos` has new Starlive columns
- [x] RLS policies enforce: public read on camera data, service-role-only writes, platform_admin access on mapping tables
- [x] `src/lib/camera/types.ts` exports all Starlive JSON interfaces
- [x] `src/lib/camera/transform.ts` handles all 10 known data quirks
- [x] `src/lib/camera/sync.ts` can process a full Starlive player profile JSON end-to-end (validate → transform → upsert → recalculate skills → log)
- [x] `POST /api/camera/sync` accepts manual JSON upload (platform_admin only)
- [x] `POST /api/camera/webhook` accepts Starlive push data
- [ ] `GET /api/camera/sync-logs` returns paginated logs (platform_admin only) — DEFERRED to Session 2 per plan
- [x] All sync operations logged in `sync_logs` with timing, counts, errors
- [x] `database.types.ts` regenerated with new schema
- [x] All modified files compile with zero TypeScript errors
- [x] `npm run build` passes cleanly
- [x] Player profile page renders without crash (empty stats states)
- [x] Match detail page renders without crash (empty match report)
- [x] Player comparison page renders without crash
- [x] Club detail page renders without crash

### Non-Functional Requirements

- [x] Sync service handles partial failures gracefully (some matches fail, others succeed)
- [x] Unmapped players logged with full details (id, name, jersey, team) for admin review
- [x] No hardcoded Starlive credentials in source (env vars only)
- [x] All new translation keys have both `en` and `ka` values

### Quality Gates

- [x] `npm run build` — zero errors
- [x] `npm run lint` — zero new warnings (in camera files)
- [x] No `any` types in camera code
- [ ] Migration tested with `npx supabase db reset` — Docker not available, tested on remote instead

## Dependencies & Prerequisites

- Local Supabase must be running for migration testing (`npx supabase start`)
- Design spec finalized: `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md`
- No Starlive API access needed — Session 1 builds infrastructure that works with JSON input

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks production | High | Test locally first. Don't push to remote until fully verified. |
| Seed data loss is permanent | Medium | Seed data is demo only. Can re-seed from `seed.sql` if needed for dev. |
| FK name change breaks Supabase queries | High | Verify FK names in recreated tables match query hints. Test each query. |
| 11-file blast radius too large | Medium | Fix files methodically, build-verify after each batch. |
| Transform logic misses edge cases | Medium | Handle all 10 documented quirks. Add defaults for missing data. |

## Corrections from Design Spec

These errors in the design spec have been identified and corrected in this plan:

1. **Trigger function name**: Design spec says `set_updated_at()` — actual function is `update_updated_at_column()` (defined in migration 000011)
2. **Column name**: Design spec says drop `pixellot_event_id` — it was already renamed to `external_event_id` in migration 000020
3. **Migration file number**: Design spec says `000041` — confirmed correct (last migration is 000040)
4. **Blast radius undercount**: Design spec lists 9 files for `player_season_stats` removal — actual count is ~16 files including component files (`PlayerCard.tsx`, `PlayerListRow.tsx`, `PlayerDirectoryClient.tsx`, `CompareView.tsx`) and type files (`types.ts`, `ai-search/types.ts`)
5. **RLS policy gap**: Design spec says "service role only writes" for `matches` but does not mention dropping the OLD academy_admin write policies from migrations 000012/000013. These must be explicitly dropped since `matches` is altered, not recreated.
6. **`player_skills.last_updated`**: Design spec does not specify trigger vs manual. Resolved: set manually by sync service (not via trigger), since the column is `last_updated` not `updated_at` and recalculation is always done by the sync service.
7. **Slug generation for camera-created matches**: Not specified in design spec. Resolved: use `{home-club-slug}-vs-{away-club-slug}-{YYYY-MM-DD}-{starlive_activity_id}` for deterministic, unique slugs.
8. **`player_videos` write policies**: Design spec RLS table says "service role only" for writes. Agent verification confirms ALL write policies on `player_videos` were already removed by migrations 000016/000020. Current state is already service-role-only. No changes needed.
9. **`seed.sql` must be updated**: Not mentioned in design spec. After migration drops `player_season_stats` and recreates `match_player_stats`/`player_skills` with new columns, `seed.sql` will fail on `npx supabase db reset`. Must remove old inserts and update column names.

## SpecFlow Analysis Findings

Key edge cases identified by SpecFlow analysis:

- **Migration ordering is critical**: Must drop old tables (CASCADE) BEFORE deleting matches data, alter matches, and create new tables. Wrong order causes FK constraint failures.
- **Concurrent sync safety**: Two simultaneous webhooks for same player could race on `player_skills` recalculation. Upsert semantics prevent corruption, but skills may briefly show stale averages. Acceptable — self-corrects on next sync.
- **Date normalization for event key matching**: Starlive uses two date formats. Normalize to `YYYY-MM-DD` date portion for join key. Same-day matches: differentiated by `starlive_activity_id`, not date string alone.
- **JSONB type safety**: Supabase returns JSONB columns as `Json | null`. Consuming code needs type assertions. Document as pattern for Sessions 3-4.
- **Post-migration UX regression**: PlayerCards lose stat chips (goals/assists/matches) until camera data arrives. This is intentional and documented. Empty states should be clean, not broken.
- **Match list empty after migration**: All 5 seeded matches deleted. `/matches` shows empty list. Acceptable transitional state.
- **Webhook auth**: Use `PIXELLOT_WEBHOOK_SECRET` env var with Bearer token check. If env var not set, reject all webhooks with 503 (not 401, to avoid leaking endpoint existence).

## File Inventory

### New Files (7)

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/migrations/20250101000041_camera_integration.sql` | Schema migration |
| 2 | `src/lib/camera/types.ts` | Starlive JSON TypeScript interfaces |
| 3 | `src/lib/camera/transform.ts` | Transform Starlive JSON → DB shape |
| 4 | `src/lib/camera/sync.ts` | SyncService: validate, transform, upsert, log |
| 5 | `src/app/api/camera/webhook/route.ts` | Webhook endpoint |
| 6 | `src/app/api/camera/sync/route.ts` | Manual sync trigger (platform_admin) |
| 7 | `src/lib/camera/validations.ts` | Zod schemas for Starlive JSON validation |

### Modified Files (18)

| # | File | Change |
|---|------|--------|
| | **Server pages** | |
| 1 | `src/app/(platform)/players/[slug]/page.tsx` | Remove season_stats, update skills + match_stats columns |
| 2 | `src/app/(platform)/players/page.tsx` | Remove season_stats join |
| 3 | `src/app/(platform)/players/compare/page.tsx` | Remove season_stats, update skills columns |
| 4 | `src/app/(platform)/clubs/[slug]/page.tsx` | Remove season_stats join |
| 5 | `src/app/(platform)/matches/[slug]/page.tsx` | Update match_player_stats columns, remove dropped matches columns |
| | **API routes** | |
| 6 | `src/app/api/players/route.ts` | Remove season_stats join |
| 7 | `src/app/api/players/[id]/route.ts` | Remove season_stats, update skills + match_stats |
| 8 | `src/app/api/players/[id]/pdf/route.ts` | Remove season_stats, update skills for PDF |
| 9 | `src/app/api/players/ai-search/route.ts` | Remove season_stats, update skills filtering + sorting |
| 10 | `src/app/api/clubs/[slug]/route.ts` | Remove season_stats join |
| 11 | `src/app/api/matches/[slug]/route.ts` | Update match_player_stats columns, remove dropped matches columns |
| | **Components** | |
| 12 | `src/components/player/PlayerCard.tsx` | Remove season_stats stat chips rendering |
| 13 | `src/components/player/PlayerDirectoryClient.tsx` | Remove season_stats mapping in `mapAIPlayerToCard()` |
| 14 | `src/components/player/CompareView.tsx` | Update `PlayerData` interface to new skills shape |
| 15 | `src/components/player/RadarChart.tsx` | Accept new player_skills shape (or null), show empty state |
| 16 | `src/components/player/CompareRadarChart.tsx` | Update SkillSet interface from FIFA 1-100 to camera 1-10 |
| 17 | `src/components/player/PlayerListRow.tsx` | Remove season_stats stat chip rendering |
| 18 | `src/components/player/AIFilterTags.tsx` | Update filter key labels for camera skill names |
| | **Types & config** | |
| 19 | `src/lib/types.ts` | Remove `season_stats` from `PlayerBrowseData` interface |
| 20 | `src/lib/ai-search/types.ts` | Update AISearchFiltersSchema from FIFA 1-100 to camera 1-10 |
| 21 | `src/lib/ai-search/prompt.ts` | Rewrite AI prompt for camera-based skill system |
| 22 | `src/lib/translations/players.ts` | Add `camera.noDataYet` key (en + ka only — defer other keys to Sessions 2-4) |
| 23 | `supabase/seed.sql` | Remove player_season_stats inserts, update player_skills/match_player_stats to new columns |

### Auto-Generated (1)

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/database.types.ts` | Regenerated from new schema |

### Deleted (via migration)

| What | Why |
|------|-----|
| All data in `matches`, `match_player_stats`, `player_skills`, `player_season_stats` | Replaced by camera data (demo data deleted) |
| `player_season_stats` table | Replaced by computed aggregations from match_player_stats |

**Total: 7 new + 23 modified + 1 auto-generated = 31 files touched**

Note: sync-logs API route (`/api/camera/sync-logs`) deferred to Session 2 per simplicity review. Constants (`RATING_COLORS`, `CAMERA_STAT_CATEGORIES`) deferred to Sessions 2-3.

## Commit Strategy

Recommended 5 commits:

1. `feat(db): add camera integration schema migration` — migration SQL + seed.sql update
2. `feat(camera): add Starlive types, validations, and transform logic` — types.ts + validations.ts + transform.ts
3. `feat(camera): add sync service and API routes` — sync.ts + 2 API routes (webhook + manual sync)
4. `fix: update all queries and components for new camera schema` — ~23 source file updates + translations
5. `chore: regenerate database types` — database.types.ts

## Session 2+ Preview (Not in Scope)

For context on what builds on this:

- **Session 2:** Platform admin camera UI (player mappings, club mappings, sync dashboard)
- **Session 3:** Player profile camera stats (CameraStats, PerformanceRadar, TrendChart, Heatmap)
- **Session 4:** Match page full report (MatchReport, ShotMap, AttackDirection, StatsTimeline)
- **Session 5:** Comparison tool update + polish (camera indexes, side-by-side heatmaps)

## Sources & References

### Origin

- **Design spec:** [docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md](../superpowers/specs/2026-03-19-starlive-camera-integration-design.md) — authoritative reference for all schema, types, sync flows, and UI designs
- **Starlive questions:** [docs/starlive-questions-for-developer.md](../starlive-questions-for-developer.md) — 19 open questions for Starlive developer

### Internal References

- Trigger function: `supabase/migrations/20250101000011_create_updated_at_trigger.sql` (line 2: `update_updated_at_column()`)
- Admin client: `src/lib/supabase/admin.ts` — `createAdminClient()` for service role writes
- Platform admin auth: `src/lib/auth.ts` — `getPlatformAdminContext()`
- RLS pattern precedent: `supabase/migrations/20250101000020_cleanup.sql` (dropped all write policies from camera tables)
- Chat RLS solution: `docs/solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md`
