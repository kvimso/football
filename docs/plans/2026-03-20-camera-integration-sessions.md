# Camera Integration — Implementation Sessions

**Spec:** `docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md`
**Created:** 2026-03-20
**Status:** Sessions 1-2 complete, session 3 next

**Key rules:**
- List pages (player directory, match list): query real columns ONLY — never fetch JSONB
- JSONB columns (`events`, `indexes`, `fitness`, `team_stats`, `widgets`, `intervals`) only on detail pages
- Sample JSON files at: `/mnt/c/Users/kvims/OneDrive/Pictures/Saved Pictures/index.json`, `index-2.json`, `index-3.json`
- No video features — deferred until Starlive provides video delivery details
- When fixing broken imports: replace old stat displays with "No camera data yet" placeholder — real UI comes in later sessions

---

## Session 1: Database Migration + TypeScript Types ✅ COMPLETE

**Goal:** New schema live on Supabase, types generated, all existing pages compile.

### Tasks (in order)

1. **Write migration SQL** (`supabase/migrations/20250101000041_camera_integration.sql`)
   - Alter `matches` table (match_date → timestamptz, add JSONB columns, drop old columns)
   - Drop `match_player_stats`, `player_skills`, `player_season_stats`
   - Create new `match_player_stats` (hybrid schema with real columns + JSONB)
   - Create new `player_skills` (1-10 camera indexes)
   - Create `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`
   - Alter `player_videos` (add starlive columns)
   - RLS policies for all new/recreated tables
   - Delete old seed data from matches

2. **Push migration to remote Supabase** and regenerate `database.types.ts`

3. **Create TypeScript types** (`src/lib/camera/types.ts`)
   - All Starlive interfaces: `StarlivePlayerProfile`, `StarliveHeatmap`, `StarliveMatchReport`
   - All nested types: events, indexes, fitness, activities, teammates
   - See spec section "Key TypeScript Interfaces" for outlines

4. **Fix all broken imports** — update every file that references dropped/changed tables:
   - Remove `player_season_stats` from 9 files (see spec "Full Blast Radius" list)
   - Update `player_skills` references to new column names (attack/defence/fitness instead of pace/shooting/etc.)
   - Update `match_player_stats` references to new schema
   - Replace old stat displays with simple placeholders — UI rebuilt in sessions 3-4
   - `npm run build` must pass with zero errors

### Deliverable
- Schema migrated, types regenerated, all pages compile. Stats sections show placeholders.

---

## Session 2: Sync Service + Test Data ✅ COMPLETE

**Goal:** Sync pipeline working end-to-end, test data in database.

### Tasks (in order)

1. **Create transform logic** (`src/lib/camera/transform.ts`)
   - `transformPlayerData()` — extract real columns from Starlive JSON (all mapping formulas from spec)
   - `transformMatchReport()` — extract team stats into JSONB
   - `transformHeatmap()` — format coords for DB
   - `recalculatePlayerSkills()` — average indexes across all matches for a player
   - Handle all data quirks from spec: null fields, missing events, date format normalization

2. **Create sync service** (`src/lib/camera/sync.ts`)
   - `syncPlayerData(json)` — validate → transform → upsert match_player_stats → recalc skills
   - `syncMatchReport(json)` — validate → store team_stats/widgets/intervals on match
   - `syncHeatmap(json, matchId)` — validate → upsert match_heatmaps
   - Sync logging to `sync_logs` table (success/partial/failed)
   - Error handling: skip unmapped players with warning, never crash

3. **Create API routes**
   - `POST /api/camera/sync` — manual JSON upload trigger, platform_admin auth
   - `GET /api/camera/sync-logs` — returns sync history, platform_admin auth
   - `POST /api/camera/webhook` — scaffold only (logs incoming data, no auth yet)

4. **Create test mappings** — insert player/club mappings for sample data via SQL
   - Map test player IDs to our existing players
   - Map test team names to our existing clubs

5. **Seed test data** — push all 3 sample JSON files through sync service
   - Run player data sync (index.json)
   - Run match report sync (index-3.json)
   - Run heatmap sync (index-2.json)
   - Verify all data appears correctly in DB tables

6. **Verify build** — `npm run build` passes

### Deliverable
- Full sync pipeline working. Test data in all camera tables. API routes functional.

---

## Session 3: Player Profile UI ← NEXT

**Goal:** Player pages show real camera stats, ratings, heatmap.

### Tasks (in order)

1. **CameraStats component** (`src/components/player/CameraStats.tsx`)
   - Match history table: date, opponent, score, minutes, rating, goals, assists
   - Expandable match detail: events by category (attacking, passing, defending, physical)
   - "Verified by Pixellot" badge
   - Performance: fetch JSONB only when expanding a match

2. **PerformanceRadar component** (`src/components/player/PerformanceRadar.tsx`)
   - Replace FIFA hexagon with 6-axis camera indexes
   - Scale 1-10, handle null sub-scores (omit from radar)
   - Adapt or replace existing `RadarChart.tsx`

3. **TrendChart component** (`src/components/player/TrendChart.tsx`)
   - Line chart: overall rating across matches over time
   - Color coded rating thresholds

4. **Heatmap component** (`src/components/player/Heatmap.tsx`)
   - SVG football pitch with color-intensity overlay
   - Match selector dropdown
   - Color scale: blue → red

5. **Update player detail page** (`src/app/(platform)/players/[slug]/page.tsx`)
   - Wire in CameraStats, PerformanceRadar, TrendChart, Heatmap
   - Season aggregation: computed from match_player_stats (goals, assists, minutes, etc.)

6. **Update player list page** — real columns only (no JSONB), show overall rating on cards

7. **i18n** — player stats translation keys (en + ka)

8. **Verify with test data** — all components render correctly with sample data

### Deliverable
- Player profiles show camera stats, radar, trend, heatmap. Player list shows ratings.

---

## Session 4: Match Report UI

**Goal:** Match pages show full team reports with visualizations.

### Tasks (in order)

1. **MatchReport component** (`src/components/match/MatchReport.tsx`)
   - Team comparison bars: possession, xG, shots, passes, tackles, corners, fouls
   - Team "1" = home, "2" = away (mapped via match's club IDs)

2. **ShotMap component** (`src/components/match/ShotMap.tsx`)
   - SVG pitch with shot locations from shots_zones

3. **AttackDirection component** (`src/components/match/AttackDirection.tsx`)
   - Left/center/right distribution, counterattacks vs positional

4. **StatsTimeline component** (`src/components/match/StatsTimeline.tsx`)
   - Stats over 5-minute intervals
   - Shows which team dominated which periods

5. **Update match detail page** (`src/app/(platform)/matches/[slug]/page.tsx`)
   - Wire in all match components
   - Player ratings table (all players in the match, sorted by rating, clickable)

6. **Update match list page** — real columns only (no JSONB)

7. **i18n** — match report translation keys (en + ka)

### Deliverable
- Match pages show full camera reports with visualizations. All bilingual.

---

## Session 5: Comparison Tool + API Routes

**Goal:** Comparison tool uses camera data. All API routes updated.

### Tasks (in order)

1. **Update comparison tool** (`src/app/(platform)/players/compare/page.tsx`)
   - Replace FIFA skills with camera indexes (attack, defence, fitness, overall)
   - Radar overlay with real sub-scores
   - Side-by-side averages: goals/match, pass accuracy, distance
   - Side-by-side heatmaps if available
   - Update `CompareView.tsx`

2. **Update clubs page** (`src/app/(platform)/clubs/[slug]/page.tsx`)
   - Player stats from new schema

3. **Update all remaining API routes**
   - `src/app/api/players/[id]/route.ts` — camera data
   - `src/app/api/players/[id]/pdf/route.ts` — PDF export with camera stats
   - `src/app/api/players/ai-search/route.ts` — updated search
   - `src/app/api/clubs/[slug]/route.ts` — remove old references
   - `src/app/api/matches/[slug]/route.ts` — new schema

4. **Empty states** — "No camera data yet" for all components when data missing

5. **i18n** — comparison translation keys

### Deliverable
- Comparison tool works with camera data. All API routes serving new schema. Empty states everywhere.

---

## Session 6: Platform Admin + Polish + Deploy

**Goal:** Admin can manage mappings and sync. Everything polished and deployed.

### Tasks (in order)

1. **Player Mappings page** (`src/app/platform/camera/mappings/page.tsx`)
   - Table of starlive_player_map entries
   - Add/edit/delete mappings, search by club

2. **Club Mappings page** (`src/app/platform/camera/clubs/page.tsx`)
   - Table of starlive_club_map entries, add/edit

3. **Sync Dashboard page** (`src/app/platform/camera/sync/page.tsx`)
   - Manual sync trigger (JSON upload form)
   - Sync log history, expandable errors
   - Unmatched players view with quick-map action

4. **Navigation updates** — add Camera section to platform admin sidebar

5. **Constants** — rating color thresholds, stat labels in `constants.ts`

6. **Update `seed.sql`** — remove old demo stats

7. **Full build** — `npm run build` clean

8. **Update CLAUDE.md** — mark Phase 7 checklist items done

9. **Deploy to Vercel** — verify on production

### Deliverable
- Everything working and deployed. Platform admin can manage mappings and sync. Phase 7 complete.

---

## Summary

| Session | Focus | Status |
|---------|-------|--------|
| 1 | Database + Types | ✅ Complete |
| 2 | Sync Service + Test Data | ✅ Complete |
| 3 | Player Profile UI | ← Next |
| 4 | Match Report UI | Pending |
| 5 | Comparison + API Routes | Pending |
| 6 | Platform Admin + Polish + Deploy | Pending |

**Execute each session with:** `/work` pointing at this file and the session number. Read the spec for detailed schemas, data mappings, and edge cases.
