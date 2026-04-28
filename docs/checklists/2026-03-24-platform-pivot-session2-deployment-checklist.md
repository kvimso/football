# Deployment Checklist: Platform Pivot Session 2 -- Leagues + Navigation

**Date:** 2026-03-24
**Branch:** refactor/platform-pivot-session-1 (or successor)
**Deploy target:** Vercel (`football-v44v.vercel.app`) + Supabase (`jodnjhqnoawsxigrxqgv`)
**Risk level:** MEDIUM -- new table (additive), navigation overhaul (all users affected), AuthContext interface change

---

## Deployment Order Analysis

This deployment has two independent artifacts that must be coordinated:

1. **Database migration** (Supabase) -- creates `leagues` table + RLS + seed data
2. **Code deployment** (Vercel) -- new pages, components, navigation, AuthContext changes

**Dependency chain:**

```
database.types.ts is generated LOCALLY from the remote DB schema
    |
    v
Code imports League type from database.types.ts at BUILD time
    |
    v
Vercel build compiles TypeScript -- needs the League type to exist in the committed file
    |
    v
At RUNTIME, /leagues page queries the leagues table -- table must exist on remote DB
```

**Correct order:**

```
Step 1: Run migration on remote Supabase (creates leagues table)
Step 2: Regenerate database.types.ts locally (now includes leagues type)
Step 3: Commit code (includes regenerated types)
Step 4: Deploy to Vercel (build succeeds because types exist; runtime succeeds because table exists)
```

**What happens if you get the order wrong:**

| Scenario | Result |
|----------|--------|
| Deploy code BEFORE migration | Vercel build succeeds (types were committed). But /leagues page queries a table that does not exist -- runtime 500 error on first visit. |
| Migration BEFORE code deploy | Safe. Table exists but no code references it yet. Zero user impact. |
| Code deploy with stale types (forgot to regenerate) | Vercel build FAILS -- TypeScript cannot find leagues type in database.types.ts. |

**Conclusion:** Migration first, then code. The gap between them is safe because no existing page references the leagues table.

---

## Data Invariants

These must remain true before AND after deployment:

- [ ] All 8 existing profiles are unchanged (role, is_approved, club_id)
- [ ] All 3 existing clubs are unchanged
- [ ] All 13 existing players are unchanged
- [ ] The `is_approved` column on profiles still has `DEFAULT false` (Session 1 invariant)
- [ ] Column-level GRANTs on profiles still restrict UPDATE to only (full_name, organization, email, phone, country)
- [ ] The `handle_new_user()` trigger function still sets `is_approved = false` for new scouts
- [ ] No existing RLS policies on any table are modified
- [ ] After migration: exactly 3 rows in leagues table, all `is_active = true`

---

## PRE-DEPLOY (Required)

### 1. Record Baseline Values

Run these queries on the remote Supabase BEFORE any changes. Save the results.

```sql
-- BASELINE-1: Profile snapshot (save exact output)
SELECT id, email, role, is_approved, club_id
FROM public.profiles
ORDER BY role, email;
```

**Expected (8 rows):**
- 1 academy_admin (torpedo.admin@gfp.ge, is_approved=true, club_id set)
- 1 platform_admin (kvimsina@gmail.com, is_approved=true, club_id null)
- 6 scouts (all is_approved=true, club_id null)

```sql
-- BASELINE-2: Table counts
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles;
```

**Expected:** clubs=3, players=13, profiles=8

```sql
-- BASELINE-3: Verify leagues table does NOT exist yet
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'leagues'
) AS leagues_exists;
```

**Expected:** leagues_exists=false

```sql
-- BASELINE-4: Verify column-level GRANTs still intact (Session 1)
SELECT column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
ORDER BY column_name;
```

**Expected:** UPDATE only on: country, email, full_name, organization, phone
(NOT on: role, is_approved, club_id)

```sql
-- BASELINE-5: Verify is_approved column default
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_approved';
```

**Expected:** `false`

### 2. Pre-Deploy Verification Checklist

- [ ] BASELINE-1 through BASELINE-5 run and results saved
- [ ] `npm run build` passes locally with zero TypeScript errors
- [ ] All new translation keys have both `en` and `ka` values (grep for empty strings)
- [ ] No hardcoded `/clubs` references remain in nav/CTA components (only in club detail pages)
- [ ] `starlive_url` validation in LeagueCard checks for `https://` prefix
- [ ] AuthContext `isApproved` does not break existing consumers (Navbar, AvatarDropdown, etc.)
- [ ] Middleware already has `/leagues`, `/demo`, `/privacy`, `/terms` in PUBLIC_ROUTES (confirmed: it does)
- [ ] Migration SQL reviewed: uses BEGIN/COMMIT for atomicity
- [ ] Migration SQL reviewed: RLS policies use correct role check pattern
- [ ] Rollback plan reviewed by deployer

---

## DEPLOY STEPS

### Step 1: Run Database Migration

**Tool:** Supabase MCP `apply_migration` or Supabase Dashboard SQL Editor
**File:** `supabase/migrations/20250101000045_create_leagues_table.sql`

**Migration contents (verify these match before applying):**

| Operation | Description | Reversible? |
|-----------|-------------|-------------|
| CREATE TABLE leagues | 12 columns, uuid PK, timestamptz defaults | Yes -- DROP TABLE |
| CREATE INDEX idx_leagues_active | On (is_active, display_order) | Yes -- DROP INDEX |
| ENABLE RLS | Row-level security on leagues | Yes -- DISABLE RLS |
| CREATE POLICY (SELECT) | Public can view active leagues | Yes -- DROP POLICY |
| CREATE POLICY (INSERT) | Platform admin insert | Yes -- DROP POLICY |
| CREATE POLICY (UPDATE) | Platform admin update | Yes -- DROP POLICY |
| CREATE POLICY (DELETE) | Platform admin delete | Yes -- DROP POLICY |
| INSERT 3 rows | Seed: U15, U17, U19 Golden Leagues | Yes -- DELETE |

**Estimated runtime:** < 5 seconds (no existing data, no table rewrites)
**Lock impact:** None (new table, no ALTER on existing tables)

- [ ] Apply migration via Supabase MCP
- [ ] Verify migration appears in `supabase_migrations` table

### Step 2: Verify Migration

Run immediately after migration:

```sql
-- MIGRATE-1: Table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'leagues'
) AS leagues_exists;
```
**Expected:** true

```sql
-- MIGRATE-2: Correct column count and types
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leagues'
ORDER BY ordinal_position;
```
**Expected:** 12 columns (id, name, name_ka, age_group, season, starlive_url, description, description_ka, logo_url, is_active, display_order, created_at, updated_at)

```sql
-- MIGRATE-3: Seed data present
SELECT id, name, age_group, season, is_active, display_order
FROM public.leagues
ORDER BY display_order;
```
**Expected:** 3 rows (U15 display_order=1, U17 display_order=2, U19 display_order=3), all is_active=true

```sql
-- MIGRATE-4: RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'leagues';
```
**Expected:** relrowsecurity=true

```sql
-- MIGRATE-5: RLS policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'leagues'
ORDER BY policyname;
```
**Expected:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

```sql
-- MIGRATE-6: Index exists
SELECT indexname
FROM pg_indexes
WHERE tablename = 'leagues' AND indexname = 'idx_leagues_active';
```
**Expected:** 1 row

```sql
-- MIGRATE-7: Existing tables UNCHANGED (compare with BASELINE-2)
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles;
```
**Expected:** clubs=3, players=13, profiles=8 (identical to baseline)

- [ ] All MIGRATE-1 through MIGRATE-7 pass
- [ ] IF ANY FAIL: STOP. Execute rollback (Section below). Do not proceed to code deploy.

### Step 3: Regenerate Types Locally

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Then verify:

```bash
grep -c "leagues" src/lib/database.types.ts
```

**Expected:** Multiple matches (Row, Insert, Update, Relationships types for leagues)

- [ ] Types regenerated and leagues type present
- [ ] `npm run build` still passes with regenerated types

### Step 4: Commit and Push Code

```bash
git add -A  # or specific files
git commit -m "feat: add leagues table, pages, navigation overhaul (Session 2)"
git push origin refactor/platform-pivot-session-1
```

- [ ] Code committed
- [ ] Code pushed to remote

### Step 5: Deploy to Vercel

```bash
npx vercel --prod --force
```

**Estimated build time:** ~2-3 minutes
**Estimated propagation:** < 1 minute after build completes

- [ ] Vercel build succeeds (check build logs for zero TypeScript errors)
- [ ] Deployment URL accessible

---

## POST-DEPLOY VERIFICATION (Within 5 Minutes)

### Database Integrity Check

```sql
-- POST-1: Profiles unchanged (compare with BASELINE-1)
SELECT id, email, role, is_approved, club_id
FROM public.profiles
ORDER BY role, email;
```
**Expected:** Identical to BASELINE-1 (8 rows, same values)

```sql
-- POST-2: Leagues data intact
SELECT name, age_group, season, is_active, display_order
FROM public.leagues
ORDER BY display_order;
```
**Expected:** 3 rows, all is_active=true

```sql
-- POST-3: Column GRANTs still intact
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
ORDER BY column_name;
```
**Expected:** Only (country, email, full_name, organization, phone) -- no role, is_approved, club_id

### Application Smoke Tests

Run against the live Vercel URL (https://football-v44v.vercel.app).

**Public pages (no auth):**

- [ ] `/leagues` -- loads, shows 3 league cards, each links externally to Starlive
- [ ] `/privacy` -- loads, shows stub content in both EN and KA
- [ ] `/terms` -- loads, shows stub content in both EN and KA
- [ ] `/demo` -- loads, shows stub content with contact info
- [ ] `/` -- landing page loads, LandingNav shows updated links (Leagues, About, Contact, Request Demo, Login)
- [ ] `/about` -- loads, CTA now says "Explore Leagues" and links to `/leagues`
- [ ] `/players/any-slug` -- redirects to `/leagues` (not `/clubs`)
- [ ] `/matches/any-slug` -- redirects to `/leagues` (not `/clubs`)

**Logged out navigation:**

- [ ] LandingNav: `Leagues | About | Contact | Request Demo | Login`
- [ ] Footer: `About | Contact | Privacy Policy | Terms of Service | Request Demo`
- [ ] LandingFooter: same link set as Footer

**Scout navigation (login as levanitalakhadze0@gmail.com -- approved scout):**

- [ ] Navbar: `Leagues | Messages | [User menu]`
- [ ] No "About" or "Contact" in navbar (those are logged-out links)
- [ ] Messages link works (existing chat system)
- [ ] Unread message poll still works (approved scout should poll)

**Platform admin navigation (login as kvimsina@gmail.com):**

- [ ] Navbar: `Leagues | [User menu]`
- [ ] `/platform` dashboard loads
- [ ] `/platform/leagues` -- list page shows 3 leagues in table
- [ ] `/platform/leagues/new` -- create form loads, all fields present
- [ ] Create a test league, verify it appears in list AND on `/leagues` public page
- [ ] Edit the test league, verify changes persist
- [ ] Delete the test league, verify removal from list AND public page
- [ ] PlatformSidebar shows "Leagues" link after "Clubs"

**Academy admin navigation (login as torpedo.admin@gfp.ge):**

- [ ] Navbar: `Leagues | Messages | Admin | [User menu]`
- [ ] Admin dashboard loads normally

**AuthContext isApproved verification:**

- [ ] No console errors related to `isApproved` being undefined or null on any page
- [ ] User menu (AvatarDropdown) still works for all 3 roles

**Language toggle:**

- [ ] Toggle to Georgian on `/leagues` -- page title, league names, card labels all switch to KA
- [ ] Toggle to Georgian on `/privacy` and `/terms` -- stub text appears in Georgian
- [ ] Toggle to Georgian on navbar -- all link labels switch to KA
- [ ] Toggle to Georgian on footer -- all link labels switch to KA

### Checklist

- [ ] All POST-1 through POST-3 SQL queries match expected values
- [ ] All smoke tests pass
- [ ] No 500 errors in Vercel runtime logs
- [ ] No console errors in browser DevTools
- [ ] IF ANY CRITICAL FAILURE: proceed to Rollback section

---

## ROLLBACK PLAN

### Can we roll back?

- [YES] Code and database changes are independently reversible
- [YES] No existing data was modified (leagues is a new additive table)
- [YES] No existing columns were altered
- [YES] AuthContext change is additive (new field, existing fields unchanged)

### Rollback Scenarios

**Scenario A: Migration succeeded, code deploy FAILED (Vercel build error)**

No action needed on database. Fix the code, rebuild, redeploy. The leagues table sitting in the database with no code referencing it is harmless.

**Scenario B: Migration FAILED**

```sql
-- Full migration rollback (run in this exact order)
DROP POLICY IF EXISTS "Platform admins can delete leagues" ON public.leagues;
DROP POLICY IF EXISTS "Platform admins can update leagues" ON public.leagues;
DROP POLICY IF EXISTS "Platform admins can insert leagues" ON public.leagues;
DROP POLICY IF EXISTS "Public can view active leagues" ON public.leagues;
DROP INDEX IF EXISTS public.idx_leagues_active;
DROP TABLE IF EXISTS public.leagues;
```

Verify rollback:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'leagues'
) AS leagues_exists;
-- Expected: false
```

**Scenario C: Code deployed but runtime errors (pages crash, nav broken)**

1. Revert to previous Vercel deployment:
   ```bash
   # List recent deployments
   npx vercel ls --limit 5
   # Promote previous deployment
   npx vercel promote <previous-deployment-url>
   ```

2. If reverting code but keeping the migration: safe. The leagues table with 3 seed rows is inert.

3. If reverting everything (code + migration): run Scenario B SQL after reverting code.

**Scenario D: AuthContext isApproved breaks existing functionality**

This is the highest-risk change because it modifies a context provider used by every page.

Symptoms:
- Blank pages (context fails to initialize)
- Infinite redirect loops (isApproved undefined triggers unexpected middleware behavior)
- Navbar crashes (accessing isApproved on undefined context)

Rollback: revert to previous Vercel deployment (Scenario C step 1). The AuthContext change is purely frontend -- no database involvement.

**Scenario E: Navigation shows wrong links for a role**

Not a data integrity issue. Fix in code and redeploy. No database rollback needed.

### Rollback Decision Matrix

| Symptom | Severity | Action |
|---------|----------|--------|
| /leagues returns 500 | LOW | Check if migration ran; if not, run it |
| All pages blank/crash | CRITICAL | Revert Vercel deployment immediately |
| Wrong nav links for a role | MEDIUM | Fix code, redeploy |
| Redirect loops after login | HIGH | Revert Vercel deployment, debug AuthContext |
| /platform/leagues CRUD fails | LOW | Debug server actions, no user impact |
| Translation keys show raw keys | LOW | Add missing translations, redeploy |
| /players redirect goes to /clubs not /leagues | LOW | Check next.config.ts, redeploy |

---

## POST-DEPLOY MONITORING (First 24 Hours)

### Vercel Monitoring

| Check | When | How | Alert Condition |
|-------|------|-----|-----------------|
| Runtime error rate | +5 min, +1h, +4h | Vercel dashboard > Runtime Logs | Any 500 errors on /leagues, /privacy, /terms, /demo |
| Build status | Immediately | Vercel dashboard | Build failure |
| Edge function latency | +1h | Vercel dashboard > Analytics | P95 > 3s on any page |

### Supabase Monitoring

| Check | When | How | Alert Condition |
|-------|------|-----|-----------------|
| leagues row count | +1h, +24h | `SELECT count(*) FROM leagues` | Count != 3 (unless admin added/deleted) |
| RLS policy violations | +1h | Supabase logs | Any "new row violates row-level security" on leagues |
| Profile integrity | +24h | Re-run BASELINE-1 query | Any change to existing 8 profiles |

### Manual Spot Checks

**At +1 hour:**
```sql
-- Verify no unexpected writes to leagues
SELECT id, name, created_at FROM public.leagues ORDER BY created_at;
-- Expected: 3 seed rows only (unless platform admin tested CRUD)
```

**At +24 hours:**
```sql
-- Full integrity re-check
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.leagues WHERE is_active = true) AS active_leagues;
-- Expected: clubs=3, players=13, profiles=8, active_leagues=3
```

---

## RISK REGISTER

### Risk 1: AuthContext Interface Change (MEDIUM)

**What:** Adding `isApproved` to AuthContext changes the interface consumed by every component that calls `useAuth()`.

**Why it matters:** If the profile query in AuthProvider fails to include `is_approved`, or if the field is misspelled, every page that uses `useAuth()` could behave unexpectedly.

**Mitigation:**
- AuthProvider already queries profiles; adding `is_approved` to the select is a one-field change
- Default `isApproved` to `null` (not `false`) so callers can distinguish "unknown" from "not approved"
- Existing consumers that only destructure `{ user, userRole, signOut }` are unaffected by the new field
- The Navbar is the only consumer that reads `isApproved`

**Detection:** Console errors mentioning `isApproved`, wrong nav links for approved scouts.

### Risk 2: Navigation State Regression (MEDIUM)

**What:** Navbar goes from 2 states (logged in / logged out) to 5 states. Any bug in the state logic shows wrong links.

**Why it matters:** All 8 users see the navbar on every page load.

**Mitigation:**
- Test all 5 states explicitly in post-deploy smoke tests
- The 5 states are deterministic from `{ user, userRole, isApproved }` -- no race conditions
- Mobile menu must mirror desktop states (test both)

**Detection:** Visual inspection during smoke tests. Users report missing/wrong links.

### Risk 3: Redirect Target Change (LOW)

**What:** `/players/:path*` and `/matches/:path*` redirects change from `/clubs` to `/leagues` in next.config.ts.

**Why it matters:** Anyone who bookmarked a player/match URL now lands on /leagues instead of /clubs. This is intentional but could confuse users who expected /clubs.

**Mitigation:** This is the desired behavior (Session 1 stripped player/match pages). /clubs still works if accessed directly.

### Risk 4: CSP Blocking External League Logos (LOW)

**What:** If `logo_url` in leagues table points to an external domain, the `img-src` CSP header blocks it.

**Why it matters:** League logos would show as broken images.

**Mitigation:** Seed data uses no logo_url (null). If platform admin adds logos later, they should use Supabase Storage URLs (already in CSP allowlist). The plan doc notes this explicitly.

**Detection:** Broken image icons on /leagues page.

### Risk 5: Stale Types in database.types.ts (LOW)

**What:** Developer forgets to regenerate types after running the migration.

**Why it matters:** Vercel build fails (TypeScript error) -- but this is caught before users see anything.

**Mitigation:** Step 3 of deploy process explicitly regenerates types and verifies with grep. Build step catches any omission.

---

## SPECIAL NOTES

### Existing Users Impact

All 8 existing users have `is_approved = true`. This means:
- The 6 scouts see "approved scout" nav state (Leagues | Messages | User menu)
- No user will see the "unapproved scout" nav state unless a new scout registers
- The approval gate (middleware redirect to /pending) only triggers for `is_approved = false`
- Zero risk of locking out existing users

### Session 1 Migration Already Deployed

Migration 44 (`add_is_approved_and_security_hardening`) is confirmed deployed and working:
- `is_approved` column exists with DEFAULT false
- Column-level GRANTs restrict authenticated UPDATE to safe columns
- `handle_new_user()` trigger sets is_approved=false for new scouts

This deployment does NOT modify any Session 1 artifacts. It only reads from them (AuthContext reads `is_approved`, Navbar uses it for state logic).

### No Downtime Expected

- Migration creates a new table (no locks on existing tables)
- Code deployment is atomic on Vercel (old version serves until new build is ready)
- No feature flags needed (leagues page is additive, nav changes are immediate)
