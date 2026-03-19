# Camera Integration — Implementation Sessions

**Spec:** `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md`
**Created:** 2026-03-20
**Status:** Ready to execute

---

## Session 1: Database + Core Backend

**Goal:** New schema live, sync service working, test data flowing through.

### Tasks (in order)

1. **Write migration SQL** (`supabase/migrations/20250101000041_camera_integration.sql`)
   - Alter `matches` table (match_date → timestamptz, add JSONB columns, drop old columns)
   - Drop `match_player_stats`, `player_skills`, `player_season_stats`
   - Create new `match_player_stats` (hybrid schema with real columns + JSONB)
   - Create new `player_skills` (1-10 camera indexes)
   - Create `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`
   - Alter `player_videos` (add starlive columns)
   - RLS policies for all tables
   - Delete old seed data from matches

2. **Push migration to remote Supabase** and regenerate `database.types.ts`

3. **Create TypeScript types** (`src/lib/camera/types.ts`)
   - All Starlive interfaces: `StarlivePlayerProfile`, `StarliveHeatmap`, `StarliveMatchReport`
   - All nested types: events, indexes, fitness, activities, teammates

4. **Create transform logic** (`src/lib/camera/transform.ts`)
   - `transformPlayerData()` — extract real columns from Starlive JSON
   - `transformMatchReport()` — extract team stats into JSONB
   - `transformHeatmap()` — format coords for DB
   - `recalculatePlayerSkills()` — average indexes across matches
   - All data mapping formulas from spec section "Sync Flow: Player Data"

5. **Create sync service** (`src/lib/camera/sync.ts`)
   - `syncPlayerData(json)` — validate, transform, upsert match_player_stats + recalc skills
   - `syncMatchReport(json)` — validate, store team_stats/widgets/intervals on match
   - `syncHeatmap(json, matchId)` — validate, upsert match_heatmaps
   - Sync logging to `sync_logs` table
   - Error handling: skip unmapped players, never crash

6. **Create API routes**
   - `POST /api/camera/sync` — manual trigger, accepts JSON upload, platform_admin only
   - `GET /api/camera/sync-logs` — returns sync history, platform_admin only
   - `POST /api/camera/webhook` — scaffold only (no auth yet, logs incoming data)

7. **Seed test data** — push the 3 sample Starlive JSON files through the sync service
   - Requires creating temporary player/club mappings for test data
   - Verify data appears correctly in DB

8. **Fix all broken imports** — update every file that references old tables:
   - Remove `player_season_stats` from: players page, player detail, clubs page, compare page, all API routes (9 files)
   - Update `player_skills` references to new schema
   - Update `match_player_stats` references to new schema
   - `npm run build` must pass

### Deliverable
- Schema migrated, test data in DB, all existing pages compile (may show different/empty stats UI — that's fine, UI comes in session 2-3)

---

## Session 2: Player Profile UI

**Goal:** Player pages show real camera stats, ratings, heatmap.

### Tasks (in order)

1. **CameraStats component** (`src/components/player/CameraStats.tsx`)
   - Match history table: date, opponent, score, minutes, rating, goals, assists
   - Expandable match detail: all events by category (attacking, passing, defending, physical)
   - Sum + per_minute rates, success rate percentages
   - "Verified by Pixellot" badge

2. **PerformanceRadar component** (`src/components/player/PerformanceRadar.tsx`)
   - Replace FIFA hexagon with camera indexes
   - 6-axis: forward_play, possession, dribbling, shooting, tackling, positioning
   - Scale 1-10, handle null sub-scores
   - Rewrite or adapt existing `RadarChart.tsx`

3. **TrendChart component** (`src/components/player/TrendChart.tsx`)
   - Line chart: overall rating across matches over time
   - X-axis: match dates, Y-axis: 1-10 scale
   - Color coded rating thresholds

4. **Heatmap component** (`src/components/player/Heatmap.tsx`)
   - SVG football pitch
   - Color-intensity overlay from coordinate data
   - Match selector dropdown
   - Color scale: blue → green → yellow → orange → red

5. **Season aggregation** — computed stats section
   - Query `match_player_stats` grouped by season
   - Show: matches played, goals, assists, minutes, avg pass accuracy, avg distance

6. **Update player detail page** (`src/app/(platform)/players/[slug]/page.tsx`)
   - Wire in all new components
   - Performance rule: detail page CAN fetch JSONB columns

7. **Update player list page** (`src/app/(platform)/players/page.tsx`)
   - Performance rule: list page queries real columns ONLY (no JSONB)
   - Show overall rating on player cards if available

8. **i18n** — add all camera/stats translation keys (en + ka)

9. **Verify with test data** — all components render correctly with sample data

### Deliverable
- Player profiles show camera stats, radar, trend, heatmap. List page works with new data model.

---

## Session 3: Match Reports + Comparison

**Goal:** Match pages show full team reports. Comparison tool uses camera data.

### Tasks (in order)

1. **MatchReport component** (`src/components/match/MatchReport.tsx`)
   - Team comparison bars: possession, xG, shots, passes, tackles, corners, fouls
   - Data from `matches.team_stats` JSONB (team "1" = home, "2" = away)

2. **ShotMap component** (`src/components/match/ShotMap.tsx`)
   - SVG pitch with shot locations from `shots_zones` widget
   - Color: goals (green), on target (yellow), off target (red), blocked (gray)

3. **AttackDirection component** (`src/components/match/AttackDirection.tsx`)
   - Left/center/right distribution visual
   - Counterattacks vs positional attacks

4. **StatsTimeline component** (`src/components/match/StatsTimeline.tsx`)
   - Key stats over 5-minute intervals
   - Shows which team dominated which periods

5. **Player ratings table** on match page
   - All players with: jersey, name, position, minutes, rating, goals, assists
   - Sorted by rating, clickable → player profile

6. **Update match detail page** (`src/app/(platform)/matches/[slug]/page.tsx`)
   - Wire in all match report components
   - Performance: detail page fetches JSONB

7. **Update match list page** — real columns only (no JSONB)

8. **Update comparison tool** (`src/app/(platform)/players/compare/page.tsx`)
   - Replace FIFA skills with camera indexes
   - Radar overlay with real sub-scores
   - Side-by-side averages: goals/match, pass accuracy, distance
   - Side-by-side heatmaps (if available)
   - Update `CompareView.tsx`, `RadarChart.tsx`

9. **Update API routes**
   - `src/app/api/matches/[slug]/route.ts` — new match_player_stats schema
   - `src/app/api/players/[id]/route.ts` — camera data
   - `src/app/api/players/[id]/pdf/route.ts` — PDF export with camera stats
   - `src/app/api/players/ai-search/route.ts` — updated search

10. **i18n** — match report + comparison translation keys

### Deliverable
- Match pages show full camera reports. Comparison tool works with camera data. All API routes updated.

---

## Session 4: Platform Admin + Polish

**Goal:** Admin can manage mappings and trigger syncs. Everything polished and deployed.

### Tasks (in order)

1. **Player Mappings page** (`src/app/platform/camera/mappings/page.tsx`)
   - Table of starlive_player_map entries
   - Add/edit/delete mappings
   - Search/filter by club

2. **Club Mappings page** (`src/app/platform/camera/clubs/page.tsx`)
   - Table of starlive_club_map entries
   - Add/edit mappings

3. **Sync Dashboard page** (`src/app/platform/camera/sync/page.tsx`)
   - Manual sync trigger (JSON upload)
   - Sync log history table
   - Expandable error details
   - Unmatched players view

4. **Navigation updates**
   - Add Camera section to platform admin sidebar
   - Links to mappings, clubs, sync pages

5. **Update clubs page** (`src/app/(platform)/clubs/[slug]/page.tsx`)
   - Player stats from new schema
   - Remove player_season_stats references

6. **Empty states** — "No camera data yet" for all components when data is missing

7. **Constants + translations** — rating color thresholds, stat labels, all i18n

8. **Update `seed.sql`** — remove old demo stats data

9. **Full build check** — `npm run build` clean, zero TypeScript errors

10. **Update CLAUDE.md** — mark Phase 7 checklist items as done

11. **Deploy to Vercel** — verify on production

### Deliverable
- Platform admin can manage camera mappings and sync data. All pages work. Deployed.

---

## Summary

| Session | Focus | New Files | Modified Files |
|---------|-------|-----------|----------------|
| 1 | DB + Backend | migration, types, transform, sync, 3 API routes | 9+ files (broken imports) |
| 2 | Player UI | 4 components (CameraStats, Radar, Trend, Heatmap) | player pages, translations |
| 3 | Match + Compare | 4 components (MatchReport, ShotMap, AttackDirection, Timeline) | match pages, compare, API routes |
| 4 | Admin + Polish | 3 admin pages | navigation, clubs, constants, seed, CLAUDE.md |

**Run each session with:** `/superpowers:executing-plans` or `/work` pointing at this file and the spec.
