# Deployment Checklist: Camera Integration Session 1 (Database Schema + Backend Core)

**PR:** Phase 7 Camera Integration - Session 1
**Risk Level:** HIGH - Destructive migration (drops tables, deletes all match data, recreates tables with new schema)
**Estimated Downtime:** 1-3 minutes (migration execution) + 5-10 minutes (Vercel build)
**Rollback Complexity:** Very difficult - requires database restore from backup

---

## Live Database Baseline (captured 2026-03-19)

These values were queried from the production Supabase database at `jodnjhqnoawsxigrxqgv.supabase.co`.

| Table | Row Count | Fate |
|-------|-----------|------|
| `clubs` | 3 | PRESERVED (unmodified) |
| `players` | 13 | PRESERVED (unmodified) |
| `profiles` | 8 | PRESERVED (unmodified) |
| `player_club_history` | 15 | PRESERVED (unmodified) |
| `contact_requests` | 2 | PRESERVED (unmodified) |
| `transfer_requests` | 2 | PRESERVED (unmodified) |
| `matches` | 5 | ALL ROWS DELETED, table altered (columns added/dropped) |
| `match_player_stats` | 26 | TABLE DROPPED + RECREATED (all data lost) |
| `player_skills` | 12 | TABLE DROPPED + RECREATED (all data lost) |
| `player_season_stats` | 12 | TABLE DROPPED permanently (all data lost) |
| `player_videos` | 0 | PRESERVED, columns added (no data at risk) |

**Data permanently destroyed by this migration:**
- 5 seeded matches (demo data only)
- 26 match_player_stats rows (demo data only)
- 12 player_skills rows (FIFA-style 1-100 ratings, demo data only)
- 12 player_season_stats rows (demo data only)
- `player_season_stats` table itself

**Data preserved:**
- All 13 players, 3 clubs, 8 profiles, 15 club history records
- 2 contact requests, 2 transfer requests
- 0 player videos (table preserved, columns added)

---

## Data Invariants

These conditions MUST remain true after migration:

- [ ] `players` table: 13 rows, all unchanged (ids, slugs, club assignments, platform_ids intact)
- [ ] `clubs` table: 3 rows, all unchanged
- [ ] `profiles` table: 8 rows, all unchanged (auth still works)
- [ ] `player_club_history` table: 15 rows, all unchanged
- [ ] `contact_requests` table: 2 rows, all unchanged
- [ ] `transfer_requests` table: 2 rows, all unchanged
- [ ] Player-to-club relationships: Dinamo 4, Iberia 1999 4, Torpedo 5
- [ ] `player_videos` table: 0 rows, table still exists with original columns plus new ones
- [ ] `matches` table: 0 rows, table still exists with new column set
- [ ] `match_player_stats` table: 0 rows, recreated with new schema
- [ ] `player_skills` table: 0 rows, recreated with new schema
- [ ] `player_season_stats` table: does NOT exist
- [ ] 4 new tables created: `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`
- [ ] All existing RLS policies on unaffected tables still function
- [ ] `update_updated_at_column()` trigger function still exists
- [ ] Auth login still works for all 3 test accounts

---

## [RED] Pre-Deploy (Required Before Any Migration)

### 1. Create Supabase Database Backup

There is no undo for this migration. Before anything else:

- [ ] Go to Supabase Dashboard > Project Settings > Database > Backups
- [ ] Verify a recent automatic backup exists (or trigger a manual one)
- [ ] Note the backup timestamp: _______________
- [ ] Alternatively, create a manual SQL dump:
  ```bash
  # From local machine with pg_dump installed
  pg_dump "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" \
    --data-only \
    --table=matches \
    --table=match_player_stats \
    --table=player_skills \
    --table=player_season_stats \
    > backup_camera_migration_$(date +%Y%m%d_%H%M%S).sql
  ```

### 2. Run Pre-Deploy Baseline Queries

Run these against the live database and save results. Any deviation from expected values = STOP.

```sql
-- Query 1: Row counts (SAVE THESE)
SELECT 'players' as t, COUNT(*) as c FROM players
UNION ALL SELECT 'clubs', COUNT(*) FROM clubs
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'player_club_history', COUNT(*) FROM player_club_history
UNION ALL SELECT 'contact_requests', COUNT(*) FROM contact_requests
UNION ALL SELECT 'transfer_requests', COUNT(*) FROM transfer_requests
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'match_player_stats', COUNT(*) FROM match_player_stats
UNION ALL SELECT 'player_skills', COUNT(*) FROM player_skills
UNION ALL SELECT 'player_season_stats', COUNT(*) FROM player_season_stats
UNION ALL SELECT 'player_videos', COUNT(*) FROM player_videos
ORDER BY t;
```

**Expected results:**
| Table | Expected Count |
|-------|---------------|
| clubs | 3 |
| contact_requests | 2 |
| match_player_stats | 26 |
| matches | 5 |
| player_club_history | 15 |
| player_season_stats | 12 |
| player_skills | 12 |
| player_videos | 0 |
| players | 13 |
| profiles | 8 |
| transfer_requests | 2 |

```sql
-- Query 2: Player distribution by club (MUST match after migration)
SELECT c.name, COUNT(p.id) as player_count
FROM clubs c LEFT JOIN players p ON p.club_id = c.id
GROUP BY c.id, c.name ORDER BY c.name;
```

**Expected:**
| Club | Players |
|------|---------|
| Dinamo Tbilisi Academy | 4 |
| Iberia 1999 Tbilisi Academy | 4 |
| Torpedo Kutaisi Academy | 5 |

```sql
-- Query 3: Verify player_videos has no match_id references (safe to delete matches)
SELECT COUNT(*) FROM player_videos WHERE match_id IS NOT NULL;
```

**Expected:** 0

```sql
-- Query 4: Confirm trigger function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'update_updated_at_column';
```

**Expected:** 1 row (`update_updated_at_column`)

### 3. Verify Pre-Requisites

- [ ] Backup confirmed (step 1 above)
- [ ] Baseline queries match expected values (step 2 above)
- [ ] Migration file exists: `supabase/migrations/20250101000041_camera_integration.sql`
- [ ] `npm run build` passes locally with zero errors
- [ ] All 26 files (7 new + 18 modified + 1 regenerated) committed
- [ ] No other pending migrations in the pipeline
- [ ] Vercel deployment is currently healthy (check dashboard)
- [ ] Nobody else is actively using the platform (coordinate if needed)

### 4. Review Migration SQL

Before pushing, review the migration file for these critical operations:

- [ ] Step 1: `DROP TABLE IF EXISTS match_player_stats CASCADE` -- removes FKs and RLS
- [ ] Step 1: `DROP TABLE IF EXISTS player_skills CASCADE`
- [ ] Step 1: `DROP TABLE IF EXISTS player_season_stats CASCADE`
- [ ] Step 2: `DELETE FROM matches` -- deletes 5 rows (FKs already removed by CASCADE)
- [ ] Step 3: Four `CREATE TABLE` statements (match_heatmaps, starlive_player_map, starlive_club_map, sync_logs)
- [ ] Step 4: `ALTER TABLE matches` -- adds/drops columns, changes match_date type
- [ ] Step 4: `ALTER TABLE player_videos` -- adds 3 new columns
- [ ] Step 5: `CREATE TABLE match_player_stats` and `CREATE TABLE player_skills` with new schemas
- [ ] Step 6: RLS policies, indexes, triggers
- [ ] Matches write policies: old platform_admin INSERT/UPDATE policies are dropped, no user-level write policies remain (service role only)
- [ ] Trigger uses `update_updated_at_column()` (NOT `set_updated_at()`)

---

## [YELLOW] Deploy Steps

Execute in this exact order. Do not skip steps.

### Step 1: Push Database Migration

```bash
cd ~/projects/georgian-football-platform
npx supabase db push
```

- [ ] Command completes without errors
- [ ] Output confirms migration `20250101000041_camera_integration` was applied
- [ ] Note the timestamp: _______________

**If migration fails:** Read the error carefully. The migration uses `IF EXISTS` on drops, so partial re-runs should be safe for the DROP/DELETE steps. However, CREATE TABLE steps will fail on re-run if tables partially exist. If stuck, check which step failed and consult rollback plan.

### Step 2: Regenerate Types (if not already done locally)

```bash
npx supabase gen types typescript --project-id jodnjhqnoawsxigrxqgv > src/lib/database.types.ts
```

- [ ] Types file regenerated without errors
- [ ] New tables visible in types: `match_heatmaps`, `starlive_player_map`, `starlive_club_map`, `sync_logs`
- [ ] `player_season_stats` is NOT in the types file
- [ ] `match_player_stats` has new columns (e.g., `starlive_player_id`, `events`, `indexes`, `fitness`)
- [ ] `player_skills` has new columns (e.g., `attack`, `defence`, `fitness`, `overall`)

Note: If types were already regenerated and committed as part of the PR, this step is just verification.

### Step 3: Build Verification

```bash
npm run build
```

- [ ] Build passes with zero TypeScript errors
- [ ] No new warnings related to camera/stats/skills

### Step 4: Deploy to Vercel

```bash
npx vercel --prod --force
```

- [ ] Deployment completes successfully
- [ ] Note the deployment URL: _______________
- [ ] Note the deployment ID: _______________

---

## [GREEN] Post-Deploy Verification (Within 5 Minutes)

### 1. Database Schema Verification

Run these queries against the live database immediately after migration.

```sql
-- Verify: Tables that should exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'matches', 'match_player_stats', 'player_skills', 'player_videos',
    'match_heatmaps', 'starlive_player_map', 'starlive_club_map', 'sync_logs'
  )
ORDER BY table_name;
```

**Expected:** 8 tables listed.

```sql
-- Verify: Table that should NOT exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'player_season_stats';
```

**Expected:** 0 rows.

```sql
-- Verify: New matches columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'matches'
  AND column_name IN ('starlive_activity_id', 'home_team_color', 'away_team_color',
                       'team_stats', 'widgets', 'intervals', 'intervals_widgets', 'source')
ORDER BY column_name;
```

**Expected:** 8 columns (starlive_activity_id as integer, team_stats/widgets/intervals/intervals_widgets as jsonb, others as text).

```sql
-- Verify: Old matches columns are gone
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'matches'
  AND column_name IN ('match_report', 'match_report_ka', 'highlights_url', 'camera_source', 'external_event_id');
```

**Expected:** 0 rows.

```sql
-- Verify: match_date type changed from date to timestamptz
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'match_date';
```

**Expected:** `timestamp with time zone`

```sql
-- Verify: match_player_stats new schema
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'match_player_stats'
  AND column_name IN ('starlive_player_id', 'key_passes', 'shots_on_target', 'passes_total',
                       'passes_successful', 'dribbles_success', 'dribbles_fail', 'speed_avg',
                       'pass_success_rate', 'distance_m', 'sprints_count', 'overall_rating',
                       'events', 'indexes', 'fitness')
ORDER BY column_name;
```

**Expected:** 15 columns listed.

```sql
-- Verify: player_skills new schema
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'player_skills'
  AND column_name IN ('attack', 'defence', 'fitness', 'overall', 'shooting', 'dribbling',
                       'forward_play', 'possession', 'set_piece', 'tackling', 'positioning',
                       'duels', 'pressing', 'goalkeeping', 'fitness_distance', 'fitness_intensity',
                       'fitness_speed', 'matches_counted', 'last_updated')
ORDER BY column_name;
```

**Expected:** 19 columns listed.

```sql
-- Verify: player_videos new columns
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'player_videos'
  AND column_name IN ('starlive_event_id', 'video_timestamp_start', 'video_timestamp_end');
```

**Expected:** 3 columns listed.

### 2. Data Integrity Verification

```sql
-- Verify: All destroyed data is gone
SELECT 'matches' as t, COUNT(*) as c FROM matches
UNION ALL SELECT 'match_player_stats', COUNT(*) FROM match_player_stats
UNION ALL SELECT 'player_skills', COUNT(*) FROM player_skills
ORDER BY t;
```

**Expected:** All counts = 0.

```sql
-- Verify: New tables exist and are empty
SELECT 'match_heatmaps' as t, COUNT(*) as c FROM match_heatmaps
UNION ALL SELECT 'starlive_player_map', COUNT(*) FROM starlive_player_map
UNION ALL SELECT 'starlive_club_map', COUNT(*) FROM starlive_club_map
UNION ALL SELECT 'sync_logs', COUNT(*) FROM sync_logs
ORDER BY t;
```

**Expected:** All counts = 0.

```sql
-- CRITICAL: Verify preserved data is untouched
SELECT 'players' as t, COUNT(*) as c FROM players
UNION ALL SELECT 'clubs', COUNT(*) FROM clubs
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'player_club_history', COUNT(*) FROM player_club_history
UNION ALL SELECT 'contact_requests', COUNT(*) FROM contact_requests
UNION ALL SELECT 'transfer_requests', COUNT(*) FROM transfer_requests
UNION ALL SELECT 'player_videos', COUNT(*) FROM player_videos
ORDER BY t;
```

**Expected:**
| Table | Expected Count |
|-------|---------------|
| clubs | 3 |
| contact_requests | 2 |
| player_club_history | 15 |
| player_videos | 0 |
| players | 13 |
| profiles | 8 |
| transfer_requests | 2 |

**If any count differs from baseline:** STOP. Investigate immediately. This would indicate the migration damaged unrelated data.

```sql
-- Verify: Player-club distribution unchanged
SELECT c.name, COUNT(p.id) FROM clubs c
LEFT JOIN players p ON p.club_id = c.id
GROUP BY c.id, c.name ORDER BY c.name;
```

**Expected:** Dinamo 4, Iberia 1999 4, Torpedo 5.

### 3. RLS Policy Verification

```sql
-- Verify: RLS policies on new/recreated tables
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('match_player_stats', 'player_skills', 'match_heatmaps',
                     'starlive_player_map', 'starlive_club_map', 'sync_logs')
ORDER BY tablename, cmd;
```

**Expected policies:**
| Table | Policy | Command |
|-------|--------|---------|
| match_heatmaps | public SELECT | SELECT |
| match_player_stats | public SELECT | SELECT |
| player_skills | public SELECT | SELECT |
| starlive_club_map | platform_admin SELECT | SELECT |
| starlive_club_map | platform_admin INSERT | INSERT |
| starlive_club_map | platform_admin UPDATE | UPDATE |
| starlive_club_map | platform_admin DELETE | DELETE |
| starlive_player_map | platform_admin SELECT | SELECT |
| starlive_player_map | platform_admin INSERT | INSERT |
| starlive_player_map | platform_admin UPDATE | UPDATE |
| starlive_player_map | platform_admin DELETE | DELETE |
| sync_logs | platform_admin SELECT | SELECT |

**Critical:** `match_player_stats` and `player_skills` should have NO INSERT/UPDATE/DELETE policies (service role only writes). No academy_admin or platform_admin write policies should exist on these tables.

```sql
-- Verify: Old matches write policies are gone (academy_admin can NOT write)
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'matches'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE');
```

**Expected:** Zero rows. No user-level write policies on matches. Only the public SELECT policy should remain. (Service role bypasses RLS for all writes.)

Note: The migration plan says to drop old platform_admin INSERT/UPDATE policies from migration 000016 on the `matches` table. Verify they are gone.

```sql
-- Verify: Indexes created
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_mps_player', 'idx_mps_match', 'idx_mps_rating', 'idx_mps_goals',
                    'idx_heatmaps_player', 'idx_heatmaps_match', 'idx_spm_player',
                    'idx_sync_logs_date', 'idx_sync_logs_status')
ORDER BY indexname;
```

**Expected:** 9 indexes.

```sql
-- Verify: Updated_at triggers on recreated tables
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('match_player_stats', 'match_heatmaps');
```

**Expected:** 2 triggers (one per table), using `update_updated_at_column()`.

### 4. Application Smoke Tests

Open the live site and verify each page loads without crashing:

- [ ] **Login:** Sign in as `kvimsina@gmail.com` / `Kvimsina123` -- auth still works
- [ ] **Player directory** (`/players`): Page loads, player cards render (no stat chips is expected -- stats will return with camera data)
- [ ] **Player profile** (`/players/[any-slug]`): Page loads, empty stats sections (expected)
- [ ] **Match list** (`/matches`): Page loads, empty list (expected -- 0 matches)
- [ ] **Club detail** (`/clubs/[any-slug]`): Page loads, squad list renders, no stats
- [ ] **Player comparison** (`/players/compare?...`): Page loads, radar chart shows empty/placeholder state
- [ ] **Scout dashboard** (`/dashboard`): Page loads without errors
- [ ] **Admin panel** (`/admin`): Page loads without errors (sign in as torpedo admin to verify)
- [ ] **Platform admin** (`/platform`): Page loads, camera sync routes accessible

### 5. API Route Verification

```bash
# Test camera webhook (should reject without secret)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://football-v44v.vercel.app/api/camera/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

**Expected:** 401 or 503 (rejected, not 500)

```bash
# Test sync-logs (should require auth)
curl -s -o /dev/null -w "%{http_code}" \
  https://football-v44v.vercel.app/api/camera/sync-logs
```

**Expected:** 401 (unauthenticated)

```bash
# Test manual sync (should require auth)
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://football-v44v.vercel.app/api/camera/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"player","data":{}}'
```

**Expected:** 401 (unauthenticated)

---

## [BLUE] Monitoring (First 24 Hours)

### Immediate (0-15 minutes post-deploy)

| Check | How | Expected |
|-------|-----|----------|
| Vercel deployment status | Vercel dashboard | "Ready" |
| Build errors | Vercel build logs | Zero errors |
| Runtime errors | Vercel runtime logs | Zero 500 errors |
| Supabase health | Supabase dashboard | All green |
| Auth working | Log in as each test account | Successful login |

### First Hour

- [ ] Browse 3-4 player profiles -- all load without errors
- [ ] Navigate between route groups (landing -> players -> about -> clubs) -- no flash/crash
- [ ] Check Vercel runtime logs for any new 500 errors
- [ ] Check Supabase logs for any unexpected queries or errors

### 24 Hours

- [ ] Check Vercel runtime logs for recurring errors
- [ ] Check Supabase query performance -- no degraded queries
- [ ] Verify chat system still works (messages table unaffected but confirm)
- [ ] Run the data integrity query one more time (preserved table counts)

### Metrics to Watch

| Metric | Alert Condition | Where to Check |
|--------|-----------------|----------------|
| HTTP 500 rate | Any 500 after deploy | Vercel runtime logs |
| Supabase query errors | Any unexpected errors | Supabase logs > API |
| Auth failures | Users unable to log in | Supabase Auth logs |
| Missing pages | Any 404 on known routes | Vercel deployment logs |

---

## [CYCLE] Rollback Plan

### Can We Roll Back?

**Partially -- with significant caveats.**

The code can be reverted to the previous commit, but the database migration is **not reversible** through normal means. The migration:
- Drops 3 tables (CASCADE) -- their data, RLS policies, indexes, and triggers are gone
- Deletes all match rows
- Alters `matches` and `player_videos` columns

### Rollback Scenario A: Code Only (App broken, DB migration succeeded)

If the Vercel deployment is broken but the database migration applied correctly:

1. Deploy previous commit:
   ```bash
   # Find the previous working commit
   git log --oneline -5
   # Deploy it
   npx vercel --prod --force [previous-commit-sha]
   ```
2. **Problem:** The old code references `player_season_stats`, old `player_skills` columns, old `match_player_stats` columns. The app will crash on any page that queries these.
3. **This is NOT a viable standalone rollback.** You must also restore the database.

### Rollback Scenario B: Full Restore (Nuclear Option)

If something goes seriously wrong and data is corrupted beyond the expected changes:

1. **Restore from Supabase backup:**
   - Go to Supabase Dashboard > Project Settings > Database > Backups
   - Restore the backup from before the migration
   - WARNING: This restores the ENTIRE database, including any data written after the backup (chat messages, new profiles, etc.)
2. Deploy previous commit to Vercel
3. Verify all baseline counts match

### Rollback Scenario C: Partial Recovery (Selective)

If the migration partially failed (some tables created, others not):

1. Check which step failed by examining the error message
2. Manually complete or revert the partial migration:
   ```sql
   -- If tables exist in wrong state, drop them
   DROP TABLE IF EXISTS match_heatmaps CASCADE;
   DROP TABLE IF EXISTS starlive_player_map CASCADE;
   DROP TABLE IF EXISTS starlive_club_map CASCADE;
   DROP TABLE IF EXISTS sync_logs CASCADE;
   -- Re-run the full migration manually, step by step
   ```
3. **The dropped tables (match_player_stats, player_skills, player_season_stats) and deleted match rows CANNOT be recovered without a full backup restore.**

### Rollback Decision Matrix

| Symptom | Action |
|---------|--------|
| Migration fails on `DROP TABLE` | Safe to retry -- `IF EXISTS` handles idempotency |
| Migration fails on `DELETE FROM matches` | Check if tables were already dropped -- may need manual cleanup |
| Migration fails on `CREATE TABLE` | Tables may partially exist -- drop and retry |
| Migration fails on `ALTER TABLE matches` | Most dangerous -- matches table may be in inconsistent state. Check column state manually. |
| Migration succeeds, Vercel deploy fails | Fix code issues, redeploy. DB is fine. |
| Migration succeeds, app pages crash | Check which queries fail. Likely a missed file in the 26-file update. Fix and redeploy. |
| Preserved data counts are wrong | CRITICAL -- restore from backup immediately |

### What Cannot Be Recovered Without Backup

- 5 seeded match rows
- 26 match_player_stats rows
- 12 player_skills rows (FIFA 1-100 format)
- 12 player_season_stats rows
- The `player_season_stats` table definition

These are all demo/seed data. They can be re-seeded from `supabase/seed.sql` if needed for development, but the **new schema is incompatible with the old seed data format**, so re-seeding the old data is pointless for the new system.

---

## Go/No-Go Criteria

### GO conditions (ALL must be true):

- [ ] Supabase backup confirmed and timestamped
- [ ] Pre-deploy baseline queries all match expected values
- [ ] `npm run build` passes locally with zero errors
- [ ] All 26 files committed (7 new + 18 modified + 1 regenerated)
- [ ] Migration SQL reviewed and understood
- [ ] `player_videos` has zero `match_id` references (safe to delete matches)
- [ ] No other users actively working in the platform
- [ ] Vercel deployment currently healthy
- [ ] Developer available for 30 minutes post-deploy to run verification
- [ ] This checklist is printed/open and ready to execute step by step

### NO-GO conditions (ANY one blocks deployment):

- [ ] Baseline counts differ from expected values
- [ ] `npm run build` has errors
- [ ] No database backup available
- [ ] `player_videos.match_id` has non-null references (would need to handle before deleting matches)
- [ ] Migration file references `set_updated_at()` instead of `update_updated_at_column()`
- [ ] Unresolved merge conflicts in any of the 26 files
- [ ] `update_updated_at_column()` trigger function does not exist in production DB

---

## Execution Order Summary

```
1. [PRE]   Verify Supabase backup exists
2. [PRE]   Run baseline queries, save results
3. [PRE]   Verify all Go criteria met
4. [DB]    npx supabase db push
5. [DB]    Verify migration output (no errors)
6. [TYPES] Verify database.types.ts matches new schema
7. [BUILD] npm run build (local verification)
8. [DEPLOY] npx vercel --prod --force
9. [POST]  Run schema verification queries
10. [POST]  Run data integrity queries
11. [POST]  Run RLS policy verification queries
12. [POST]  Smoke test: login, player pages, matches, clubs, comparison
13. [POST]  Test API routes (webhook, sync, sync-logs)
14. [MON]   Check Vercel logs for 15 minutes
15. [MON]   Re-check data integrity at +1 hour
16. [MON]   Final check at +24 hours
```

---

## Appendix: Exact Match Data Being Deleted

For reference, these are the 5 matches that will be permanently deleted:

| Slug | Home vs Away | Date | Score | Competition |
|------|-------------|------|-------|-------------|
| dinamo-vs-iberia1999-2025-09-15 | Dinamo vs Iberia 1999 | 2025-09-15 | 3-1 | Erovnuli Liga U19 |
| torpedo-vs-dinamo-2025-10-03 | Torpedo vs Dinamo | 2025-10-03 | 2-2 | Erovnuli Liga U19 |
| iberia1999-vs-torpedo-2025-10-20 | Iberia 1999 vs Torpedo | 2025-10-20 | 2-0 | Erovnuli Liga U19 |
| dinamo-vs-torpedo-2025-11-10 | Dinamo vs Torpedo | 2025-11-10 | 4-1 | Erovnuli Liga U19 |
| iberia1999-vs-dinamo-2025-12-01 | Iberia 1999 vs Dinamo | 2025-12-01 | 1-1 | Georgian U19 Cup Semifinal |

All are demo/seed data with no real-world value. The platform will have zero matches until camera data arrives from Starlive.

## Appendix: Current RLS Policies on matches (to be dropped by migration)

These write policies currently exist and must be dropped by the migration (camera-only writes going forward):

| Policy Name | Command | Notes |
|-------------|---------|-------|
| Platform admins can insert matches | INSERT | From migration 000016, must be dropped |
| Platform admins can update matches | UPDATE | From migration 000016, must be dropped |

The `Matches are publicly viewable` SELECT policy should remain.

**After migration:** Only the SELECT policy should exist on `matches`. All writes go through service role (camera sync service).
