# Deployment Checklist: Platform Pivot Session 3 -- Demo Requests + Landing Redesign

**Date:** 2026-03-24
**Branch:** refactor/platform-pivot-session-1 (or successor)
**Deploy target:** Vercel (`football-v44v.vercel.app`) + Supabase (`jodnjhqnoawsxigrxqgv`)
**Risk level:** MEDIUM -- new table with REVOKE (non-standard access pattern), auth callback modification (affects all new user sign-ups), landing page content overhaul (affects all visitors)

---

## Deployment Order Analysis

This deployment has two independent artifacts that must be coordinated:

1. **Database migration** (Supabase) -- creates `demo_requests` table + indexes + trigger + REVOKE
2. **Code deployment** (Vercel) -- new pages, server actions, API route, landing page rewrites, translation updates

**Dependency chain:**

```
database.types.ts is generated LOCALLY from the remote DB schema
    |
    v
Code imports DemoRequest type from database.types.ts at BUILD time
    |
    v
Vercel build compiles TypeScript -- needs the DemoRequest type in the committed file
    |
    v
At RUNTIME, submitDemoRequest() INSERTs into demo_requests via service role -- table must exist
At RUNTIME, /api/demo-requests/mine SELECTs from demo_requests via service role -- table must exist
At RUNTIME, /platform/demo-requests SELECTs from demo_requests via service role -- table must exist
```

**Correct order:**

```
Step 1: Run migration on remote Supabase (creates demo_requests table)
Step 2: Regenerate database.types.ts locally (now includes demo_requests type)
Step 3: Commit code (includes regenerated types + all new/modified files)
Step 4: Deploy to Vercel (build succeeds because types exist; runtime succeeds because table exists)
```

**What happens if you get the order wrong:**

| Scenario | Result |
|----------|--------|
| Deploy code BEFORE migration | Vercel build succeeds (types were committed). But /demo form submission fails at runtime (table does not exist). /platform/demo-requests crashes. /api/demo-requests/mine returns 500. Auth callback backfill throws (caught, non-fatal). |
| Migration BEFORE code deploy | Safe. Table exists but no code references it yet. Zero user impact. |
| Code deploy with stale types (forgot to regenerate) | Vercel build FAILS -- TypeScript cannot find demo_requests type in database.types.ts. |

**Conclusion:** Migration first, then code. The gap between them is safe because the only existing reference to `/demo` is a stub page that does not query the database.

### Special Note: Auth Callback Change

The auth callback modification (`src/app/(auth)/callback/route.ts`) adds a `demo_requests` backfill UPDATE after `exchangeCodeForSession`. This is wrapped in try/catch so:
- If migration has NOT run: backfill throws "relation does not exist", catch logs it, auth flow continues normally
- If migration HAS run: backfill succeeds silently
- Either way, users can still log in. This is NOT a blocking dependency but is a reason to run migration first.

---

## Data Invariants

These must remain true before AND after deployment:

- [ ] All existing profiles are unchanged (role, is_approved, club_id)
- [ ] All existing clubs are unchanged
- [ ] All existing players are unchanged
- [ ] All existing leagues are unchanged (3 rows, all is_active=true)
- [ ] The `is_approved` column on profiles still has `DEFAULT false` (Session 1 invariant)
- [ ] Column-level GRANTs on profiles still restrict UPDATE to only (full_name, organization, email, phone, country)
- [ ] The `handle_new_user()` trigger function still sets `is_approved = false` for new scouts
- [ ] No existing RLS policies on any table are modified
- [ ] After migration: `demo_requests` table exists with REVOKE on anon+authenticated
- [ ] After migration: anon and authenticated roles CANNOT query demo_requests directly
- [ ] After migration: service role CAN query demo_requests (bypasses GRANTs)
- [ ] After migration: `updated_at` trigger fires on UPDATE to demo_requests

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
-- BASELINE-2: Table counts (all existing tables)
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.leagues) AS leagues;
```

**Expected:** clubs=3, players=13, profiles=8, leagues=3

```sql
-- BASELINE-3: Verify demo_requests table does NOT exist yet
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'demo_requests'
) AS demo_requests_exists;
```

**Expected:** demo_requests_exists=false

```sql
-- BASELINE-4: Column-level GRANTs on profiles still intact (Session 1 invariant)
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

```sql
-- BASELINE-6: Leagues data intact from Session 2
SELECT name, age_group, season, is_active
FROM public.leagues
ORDER BY display_order;
```

**Expected:** 3 rows, all is_active=true

### 2. Pre-Deploy Verification Checklist

- [ ] BASELINE-1 through BASELINE-6 run and results saved
- [ ] `npm run build` passes locally with zero TypeScript errors
- [ ] All new translation keys have both `en` and `ka` values
- [ ] Migration SQL reviewed: uses BEGIN/COMMIT for atomicity
- [ ] Migration SQL reviewed: REVOKE on anon AND authenticated (not just one)
- [ ] Migration SQL reviewed: CHECK constraints on `role` and `status` columns
- [ ] Migration SQL reviewed: 4 indexes (status, user_id partial, email lower, created_at desc)
- [ ] Migration SQL reviewed: `updated_at` trigger function + trigger created
- [ ] Auth callback change is wrapped in try/catch (non-blocking)
- [ ] Auth callback change uses `createAdminClient()` (not regular client)
- [ ] `/api/demo-requests/mine` validates session before querying with service role
- [ ] `submitDemoRequest` server action validates with Zod before INSERT
- [ ] Admin server actions all use `getPlatformAdminContext()`
- [ ] No `/register` links remain in landing page components (CTAs point to `/demo`)
- [ ] Academy CTA still points to `/login` (not `/demo`)
- [ ] Honeypot field present in demo form (anti-spam)
- [ ] Rollback plan reviewed by deployer

---

## DEPLOY STEPS

### Step 1: Run Database Migration

**Tool:** Supabase MCP `apply_migration` or Supabase Dashboard SQL Editor
**File:** `supabase/migrations/20250101000046_create_demo_requests.sql`

**Migration contents (verify these match before applying):**

| Operation | Description | Reversible? |
|-----------|-------------|-------------|
| CREATE TABLE demo_requests | 11 columns, uuid PK, timestamptz defaults, CHECK constraints | Yes -- DROP TABLE |
| REVOKE ALL on demo_requests | Removes access from anon + authenticated roles | Yes -- GRANT ALL |
| CREATE INDEX idx_demo_requests_status | On (status) | Yes -- DROP INDEX |
| CREATE INDEX idx_demo_requests_user_id | Partial on (user_id) WHERE user_id IS NOT NULL | Yes -- DROP INDEX |
| CREATE INDEX idx_demo_requests_email | On (lower(email)) | Yes -- DROP INDEX |
| CREATE INDEX idx_demo_requests_created | On (created_at DESC) | Yes -- DROP INDEX |
| CREATE FUNCTION update_demo_requests_updated_at() | Trigger function for updated_at | Yes -- DROP FUNCTION |
| CREATE TRIGGER trg_demo_requests_updated_at | BEFORE UPDATE trigger | Yes -- DROP TRIGGER |

**Estimated runtime:** < 5 seconds (new table, no existing data, no table rewrites)
**Lock impact:** None (new table, no ALTER on existing tables)

- [ ] Apply migration via Supabase MCP or SQL Editor
- [ ] Verify migration appears in `supabase_migrations` table

### Step 2: Verify Migration

Run immediately after migration:

```sql
-- MIGRATE-1: Table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'demo_requests'
) AS demo_requests_exists;
```
**Expected:** true

```sql
-- MIGRATE-2: Correct columns and types
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'demo_requests'
ORDER BY ordinal_position;
```
**Expected:** 11 columns: id (uuid), user_id (uuid, nullable), full_name (text), email (text), organization (text), role (text), country (text), message (text, nullable), admin_notes (text, nullable), status (text, default 'new'), created_at (timestamptz), updated_at (timestamptz)

```sql
-- MIGRATE-3: CHECK constraints exist
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.demo_requests'::regclass
  AND contype = 'c'
ORDER BY conname;
```
**Expected:** 2 CHECK constraints:
- role IN ('Scout', 'Club Sporting Director', 'Agent', 'Academy Director', 'Other')
- status IN ('new', 'contacted', 'demo_done', 'converted', 'declined')

```sql
-- MIGRATE-4: REVOKE confirmed -- anon cannot query
-- Run this as anon role (or test via browser console with anon key)
-- This query should FAIL with permission denied:
-- SELECT * FROM demo_requests LIMIT 1;

-- Verify via information_schema:
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'demo_requests'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;
```
**Expected:** ZERO rows (no privileges granted to anon or authenticated)

```sql
-- MIGRATE-5: All 4 indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'demo_requests'
  AND schemaname = 'public'
ORDER BY indexname;
```
**Expected:** 5 indexes (1 primary key + 4 custom):
- demo_requests_pkey
- idx_demo_requests_created
- idx_demo_requests_email
- idx_demo_requests_status
- idx_demo_requests_user_id

```sql
-- MIGRATE-6: Trigger exists
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'demo_requests'
  AND event_object_schema = 'public';
```
**Expected:** 1 trigger: `trg_demo_requests_updated_at`, UPDATE, BEFORE

```sql
-- MIGRATE-7: Trigger function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_demo_requests_updated_at';
```
**Expected:** 1 row

```sql
-- MIGRATE-8: Test trigger works (insert + update + verify updated_at changes)
INSERT INTO public.demo_requests (full_name, email, organization, role, country, status)
VALUES ('Test Trigger', 'test@test.com', 'Test Org', 'Scout', 'Georgia', 'new');

-- Wait 1 second, then update:
UPDATE public.demo_requests
SET status = 'contacted'
WHERE email = 'test@test.com';

-- Verify updated_at > created_at:
SELECT
  full_name,
  status,
  created_at,
  updated_at,
  updated_at > created_at AS trigger_worked
FROM public.demo_requests
WHERE email = 'test@test.com';

-- Cleanup:
DELETE FROM public.demo_requests WHERE email = 'test@test.com';
```
**Expected:** trigger_worked = true

```sql
-- MIGRATE-9: Existing tables UNCHANGED (compare with BASELINE-2)
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.leagues) AS leagues;
```
**Expected:** clubs=3, players=13, profiles=8, leagues=3 (identical to BASELINE-2)

- [ ] All MIGRATE-1 through MIGRATE-9 pass
- [ ] IF ANY FAIL: STOP. Execute rollback (Section below). Do not proceed to code deploy.

### Step 3: Regenerate Types Locally

```bash
npx supabase gen types typescript --local > src/lib/database.types.ts
```

Then verify:

```bash
grep -c "demo_requests" src/lib/database.types.ts
```

**Expected:** Multiple matches (Row, Insert, Update, Relationships types for demo_requests)

```bash
# Verify the type includes the right columns
grep -A 5 "demo_requests" src/lib/database.types.ts | head -20
```

- [ ] Types regenerated and demo_requests type present
- [ ] `npm run build` still passes with regenerated types

### Step 4: Commit and Push Code

```bash
git add -A  # or specific files
git commit -m "feat: add demo request system + landing page redesign (Session 3)"
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
-- POST-2: Leagues unchanged (compare with BASELINE-6)
SELECT name, age_group, season, is_active
FROM public.leagues
ORDER BY display_order;
```
**Expected:** 3 rows, identical to BASELINE-6

```sql
-- POST-3: Column GRANTs on profiles still intact
SELECT column_name
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND grantee = 'authenticated'
  AND privilege_type = 'UPDATE'
ORDER BY column_name;
```
**Expected:** Only (country, email, full_name, organization, phone) -- no role, is_approved, club_id

```sql
-- POST-4: demo_requests table exists and is empty (no accidental writes)
SELECT count(*) AS demo_request_count FROM public.demo_requests;
```
**Expected:** 0 (no rows yet, unless you seeded test data)

```sql
-- POST-5: REVOKE still in effect
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'demo_requests'
  AND grantee IN ('anon', 'authenticated');
```
**Expected:** ZERO rows

### Application Smoke Tests

Run against the live Vercel URL (https://football-v44v.vercel.app).

**Public pages (no auth):**

- [ ] `/demo` -- loads, shows split layout with value prop (left) and form (right)
- [ ] `/demo` -- form has all fields: Full name, Email, Organization, Role dropdown, Country dropdown, Message textarea
- [ ] `/demo` -- form validates required fields (try submitting empty)
- [ ] `/demo` -- submit with valid data shows success state ("Thank you" message)
- [ ] `/demo` -- honeypot field is hidden (not visible to users, present in DOM with aria-hidden)
- [ ] `/demo` -- pricing section shows EUR 1,990/year (club), EUR 490/year (scout), EUR 350/month (academy)
- [ ] `/` -- landing page loads, all CTAs point to `/demo` (not `/register`)
- [ ] `/` -- no references to removed features (watchlist, player comparison, AI search, radar charts, PDF export)
- [ ] `/` -- HowItWorks section shows new 3-step flow: Request Demo, Explore Leagues, Connect
- [ ] `/about` -- loads, no stale `/register` or `/players` links

**Demo form database verification (after a test submission):**

```sql
-- POST-6: Verify demo request was inserted correctly
SELECT id, full_name, email, organization, role, country, message, status, user_id, created_at
FROM public.demo_requests
ORDER BY created_at DESC
LIMIT 1;
```
**Expected:** The test submission with status='new', user_id=null (if submitted anonymously)

```sql
-- Cleanup: delete test submission
DELETE FROM public.demo_requests WHERE email = '<test-email>';
```

**Auth callback backfill test:**

1. Submit a demo request anonymously with a new email (e.g., testbackfill@example.com)
2. Register a new account with the same email
3. After email confirmation, verify:

```sql
-- POST-7: Backfill linked user_id to demo request
SELECT id, email, user_id, status
FROM public.demo_requests
WHERE email = 'testbackfill@example.com';
```
**Expected:** user_id is now set to the newly created user's UUID

4. Cleanup: delete test user and demo request after verification

**Logged-in user behavior:**

- [ ] Log in as an existing user with no demo request
- [ ] Visit `/demo` -- form appears (not "already submitted" state)
- [ ] Email field auto-filled with logged-in user's email
- [ ] Submit demo request
- [ ] Refresh `/demo` -- shows "already submitted" status card instead of form
- [ ] A second submission attempt is blocked (server-side duplicate check)

**API route verification:**

- [ ] `GET /api/demo-requests/mine` (unauthenticated) -- returns 401
- [ ] `GET /api/demo-requests/mine` (authenticated, no demo request) -- returns `{ demoRequest: null }`
- [ ] `GET /api/demo-requests/mine` (authenticated, has demo request) -- returns `{ demoRequest: { id, status, created_at } }`

**Platform admin panel:**

Login as kvimsina@gmail.com:

- [ ] PlatformSidebar shows "Demo Requests" link between "Leagues" and "Players"
- [ ] Badge shows count of `new` requests (if any exist)
- [ ] `/platform/demo-requests` -- table loads, shows all demo requests
- [ ] Status dropdown works -- change a request from "new" to "contacted"
- [ ] Admin notes -- edit textarea, blur to save, verify persists on refresh
- [ ] Filter by status works (All, New, Contacted, Demo Done, Converted, Declined)
- [ ] "Approve Account" button visible only when user_id IS NOT NULL AND status = "converted"
- [ ] For a converted+linked request: click "Approve Account" -- verify profile gets is_approved=true

**Pending page integration:**

1. Register a new scout account (will be unapproved)
2. Submit a demo request before or after registration
3. After email confirmation, land on `/pending`

- [ ] `/pending` -- shows demo request status (if one is linked)
- [ ] `/pending` -- status text matches: "new" = received message, "contacted" = check email, "demo_done" = finalizing access, "declined" = contact info@gft.ge
- [ ] `/pending` -- polling updates status without page refresh (change status in admin panel, wait up to 30s)
- [ ] `/pending` -- when admin approves: page redirects to `/dashboard`
- [ ] `/pending` -- user with no demo request sees "Request a demo to get started" CTA

**Language toggle (bilingual verification):**

- [ ] Toggle to Georgian on `/demo` -- all labels, pricing, benefits, status messages in Georgian
- [ ] Toggle to Georgian on landing page -- all updated CTAs and copy in Georgian
- [ ] Toggle to Georgian on `/platform/demo-requests` -- table headers, status labels in Georgian
- [ ] Toggle to Georgian on `/pending` -- demo request status messages in Georgian
- [ ] No raw translation keys visible (e.g., `demo.submit` instead of actual text)

**Mobile responsive:**

- [ ] `/demo` -- form stacks vertically on mobile (< 768px)
- [ ] `/platform/demo-requests` -- table scrolls horizontally on mobile
- [ ] PlatformSidebar mobile tab bar includes "Demo Requests" link

### Checklist

- [ ] All POST-1 through POST-7 SQL queries match expected values
- [ ] All smoke tests pass
- [ ] No 500 errors in Vercel runtime logs
- [ ] No console errors in browser DevTools
- [ ] IF ANY CRITICAL FAILURE: proceed to Rollback section

---

## ROLLBACK PLAN

### Can we roll back?

- [YES] Database change is purely additive (new table, no existing tables modified)
- [YES] Code changes to existing files are reversible via git revert
- [YES] Auth callback backfill is try/catch wrapped -- removing it has no data consequence
- [YES] Landing page content changes are purely cosmetic -- no data dependency
- [PARTIAL] Demo requests submitted between deploy and rollback would be lost on table DROP (acceptable -- this is pre-launch data)

### Rollback Scenarios

**Scenario A: Migration succeeded, code deploy FAILED (Vercel build error)**

No action needed on database. Fix the code, rebuild, redeploy. The `demo_requests` table sitting in the database with no code referencing it is harmless. The existing `/demo` stub page still works (it does not query the table).

**Scenario B: Migration FAILED (partial apply)**

The migration uses BEGIN/COMMIT so it should be atomic. If it fails midway, PostgreSQL rolls back the entire transaction. However, if the migration was applied outside a transaction:

```sql
-- Full migration rollback (run in this exact order)
DROP TRIGGER IF EXISTS trg_demo_requests_updated_at ON public.demo_requests;
DROP FUNCTION IF EXISTS public.update_demo_requests_updated_at();
DROP INDEX IF EXISTS public.idx_demo_requests_created;
DROP INDEX IF EXISTS public.idx_demo_requests_email;
DROP INDEX IF EXISTS public.idx_demo_requests_user_id;
DROP INDEX IF EXISTS public.idx_demo_requests_status;
DROP TABLE IF EXISTS public.demo_requests;
```

Verify rollback:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'demo_requests'
) AS demo_requests_exists;
-- Expected: false
```

**Scenario C: Code deployed but demo form crashes (500 on /demo)**

Likely causes:
1. Table does not exist -- run migration (Step 1)
2. Service role key missing on Vercel -- check env vars (`SUPABASE_SERVICE_ROLE_KEY`)
3. Type mismatch in Zod schema vs database columns -- check Vercel runtime logs

Mitigation: The demo form failure does NOT affect any other page. Landing page, leagues, auth, admin panel all work independently. Fix the issue and redeploy without reverting.

**Scenario D: Auth callback backfill breaks login flow**

This is the highest-risk code change because it runs in the critical auth path.

Symptoms:
- Users cannot log in after email confirmation
- Auth callback returns 500 or redirects to /login
- Infinite redirect loop between /callback and /login

However: the backfill is wrapped in try/catch. If it throws, the auth flow continues normally. A failure here means the backfill silently fails, but the user still gets authenticated and redirected correctly.

If the try/catch somehow fails to catch (extremely unlikely):
1. Revert to previous Vercel deployment:
   ```bash
   npx vercel ls --limit 5
   npx vercel promote <previous-deployment-url>
   ```
2. No database rollback needed -- the table existing is harmless.

**Scenario E: REVOKE not applied -- anon users can query demo_requests**

Symptoms: Data leakage (anyone with the anon key can read all demo requests)

Detection: Run MIGRATE-4 query. If grants exist for anon/authenticated, the REVOKE failed.

Fix:
```sql
REVOKE ALL ON public.demo_requests FROM anon, authenticated;
```

Verify:
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'demo_requests'
  AND grantee IN ('anon', 'authenticated');
-- Expected: ZERO rows
```

**Scenario F: Landing page shows wrong content / broken links**

Not a data integrity issue. Fix in code and redeploy. No database rollback needed.

**Scenario G: PendingPolling crashes or does not show demo request status**

Not blocking -- users can still wait for approval via the existing approval polling. Fix in code and redeploy.

### Rollback Decision Matrix

| Symptom | Severity | Action |
|---------|----------|--------|
| /demo form returns 500 | LOW | Check if migration ran; if not, run it. Check service role env var. |
| Auth callback 500 (users cannot log in) | CRITICAL | Revert Vercel deployment immediately |
| All pages blank/crash | CRITICAL | Revert Vercel deployment immediately |
| Demo requests readable by anon key | HIGH | Run REVOKE immediately (Scenario E) |
| Landing page shows stale content | LOW | Verify deployment propagated; redeploy if needed |
| /platform/demo-requests crashes | LOW | Debug server actions, no public user impact |
| Translation keys show raw keys | LOW | Add missing translations, redeploy |
| PendingPolling does not show demo status | LOW | Users still see basic pending page; fix and redeploy |
| "Approve Account" button does not work | MEDIUM | Admin can still approve via /platform/scouts; debug and redeploy |
| Duplicate demo requests inserted | LOW | Admin can deduplicate manually; fix duplicate check logic |

---

## POST-DEPLOY MONITORING (First 24 Hours)

### Vercel Monitoring

| Check | When | How | Alert Condition |
|-------|------|-----|-----------------|
| Runtime error rate | +5 min, +1h, +4h | Vercel dashboard > Runtime Logs | Any 500 errors on /demo, /api/demo-requests/mine, /platform/demo-requests |
| Build status | Immediately | Vercel dashboard | Build failure |
| Auth callback errors | +1h, +4h | Vercel runtime logs, filter for `[callback]` | Any errors mentioning "demo request backfill" |
| Edge function latency | +1h | Vercel dashboard > Analytics | P95 > 3s on /demo page |

### Supabase Monitoring

| Check | When | How | Alert Condition |
|-------|------|-----|-----------------|
| demo_requests row count | +1h, +24h | `SELECT count(*) FROM demo_requests` | Unexpectedly high count (possible spam) |
| REVOKE integrity | +1h | Run MIGRATE-4 query | Any privileges visible for anon/authenticated |
| Profile integrity | +24h | Re-run BASELINE-1 query | Any change to existing profiles |
| Leagues integrity | +24h | Re-run BASELINE-6 query | Any unexpected changes |
| demo_requests with user_id | +24h | See query below | Backfill failures (submitted then registered, but not linked) |

### Manual Spot Checks

**At +1 hour:**

```sql
-- Verify demo_requests table contents
SELECT id, full_name, email, organization, role, status, user_id IS NOT NULL AS has_user
FROM public.demo_requests
ORDER BY created_at DESC;
-- Expected: Only legitimate submissions (if any)

-- Check for spam patterns
SELECT email, count(*) AS submissions
FROM public.demo_requests
GROUP BY email
HAVING count(*) > 1
ORDER BY submissions DESC;
-- Expected: 0 rows (no duplicate emails from anonymous users is normal; duplicates may indicate spam)
```

**At +4 hours:**

```sql
-- Verify REVOKE still intact (paranoia check)
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'demo_requests'
  AND grantee IN ('anon', 'authenticated');
-- Expected: ZERO rows

-- Check auth callback backfill is working (if any users registered after deploy)
SELECT dr.email, dr.user_id, p.email AS profile_email
FROM public.demo_requests dr
LEFT JOIN public.profiles p ON p.id = dr.user_id
WHERE dr.user_id IS NOT NULL;
-- Expected: user_id matches a real profile with matching email
```

**At +24 hours:**

```sql
-- Full integrity re-check
SELECT
  (SELECT count(*) FROM public.clubs) AS clubs,
  (SELECT count(*) FROM public.players) AS players,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.leagues WHERE is_active = true) AS active_leagues,
  (SELECT count(*) FROM public.demo_requests) AS demo_requests,
  (SELECT count(*) FROM public.demo_requests WHERE status = 'new') AS new_demo_requests;
-- Expected: clubs=3, players=13, profiles=8 (plus any new registrations), active_leagues=3

-- Check for orphaned demo requests (submitted but user registered with different email)
SELECT dr.email AS demo_email, dr.user_id, dr.status
FROM public.demo_requests dr
WHERE dr.user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users u
    WHERE lower(u.email) = lower(dr.email)
  );
-- Expected: 0 rows (backfill should have linked them).
-- If rows exist: backfill may have failed. Admin can manually link or ignore.
```

---

## RISK REGISTER

### Risk 1: REVOKE Access Pattern (MEDIUM)

**What:** `demo_requests` uses REVOKE instead of RLS. All access goes through service role client (`createAdminClient()`). This is a non-standard pattern in this codebase (most tables use RLS).

**Why it matters:** If any developer accidentally uses the regular Supabase client (anon/authenticated) to query `demo_requests`, the query will fail silently (no rows returned) or throw a permission error. This is by design but could cause confusing bugs.

**Mitigation:**
- All `demo_requests` access in the codebase uses `createAdminClient()` (service role)
- The API route `/api/demo-requests/mine` validates session FIRST with regular client, then queries with service role
- Server actions follow the same pattern
- MIGRATE-4 verification confirms REVOKE is applied

**Detection:** 500 errors on /demo form submission, /api/demo-requests/mine, or /platform/demo-requests.

### Risk 2: Auth Callback Modification (MEDIUM)

**What:** Adding a demo_requests UPDATE to the auth callback path (`src/app/(auth)/callback/route.ts`).

**Why it matters:** The auth callback is a critical path -- every new user passes through it after email confirmation. A bug here blocks all new registrations.

**Mitigation:**
- Backfill is wrapped in try/catch with console.error logging
- Backfill uses `createAdminClient()` (required because of REVOKE)
- The existing auth flow (exchangeCodeForSession, profile query, role-based redirect) is UNCHANGED
- Backfill runs AFTER the session is already established, so failure cannot lock users out
- `.ilike()` for case-insensitive email matching (Supabase normalizes emails)
- `.limit(1)` prevents linking multiple requests

**Detection:** Vercel runtime logs showing `[callback] Demo request backfill error:`. Auth flow still works; only the backfill step fails.

### Risk 3: Landing Page Content Regression (LOW)

**What:** Multiple landing page components are rewritten: LandingHero, HowItWorks, AudiencePanels, CtaBanner, LandingFooter. Old content about watchlists, player comparison, AI search, etc. is removed.

**Why it matters:** This is the first thing visitors see. Broken layout, missing translations, or dead links reduce trust.

**Mitigation:**
- All components are self-contained (no cross-component state)
- Changes are purely content/translation key swaps, not structural
- Mobile responsive testing in smoke tests
- Bilingual verification in smoke tests

**Detection:** Visual inspection during smoke tests. Raw translation keys visible = missing i18n entry.

### Risk 4: Spam on Demo Form (LOW)

**What:** The `/demo` form is publicly accessible. Anonymous users can submit unlimited requests.

**Why it matters:** Table fills with junk data, making admin management harder.

**Mitigation:**
- Honeypot field (hidden input that bots fill, humans skip) -- server rejects submissions with filled honeypot
- Zod validation rejects malformed data
- Logged-in users can only submit one request (duplicate check)
- Anonymous duplicates are allowed but identifiable by email in admin panel
- Future: rate limiting can be added per IP

**Detection:** High row count in demo_requests. Multiple submissions from similar emails.

### Risk 5: PendingPolling Enhancement (LOW)

**What:** PendingPolling component now fetches from `/api/demo-requests/mine` alongside the existing `profiles.is_approved` poll.

**Why it matters:** If the API route fails, the pending page degrades gracefully (shows basic pending state without demo request info).

**Mitigation:**
- API route failure returns null, component falls back to "no demo request" state
- Same 30s polling interval, no separate timer
- Existing approval redirect behavior is unchanged

**Detection:** Console errors from fetch failures. Users report not seeing their demo request status on /pending.

---

## SPECIAL NOTES

### Existing Users Impact

All 8 existing users have `is_approved = true`. None of them have demo requests. This means:
- No existing user will see the "already submitted" state on /demo
- No existing user's /pending page is affected (they bypass /pending via approval gate)
- The platform admin will see an empty demo requests table initially
- Zero risk of disrupting existing user sessions

### Service Role Dependency

The `SUPABASE_SERVICE_ROLE_KEY` environment variable MUST be set on Vercel for the following to work:
- `submitDemoRequest()` server action
- `/api/demo-requests/mine` API route
- `/platform/demo-requests` admin page
- Auth callback backfill

Verify with:
```bash
npx vercel env ls | grep SUPABASE_SERVICE_ROLE_KEY
```
This key was already set for existing features (admin invite, chat system). If it is missing, all demo request features will fail with "Admin client configuration error."

### Session 1 and Session 2 Artifacts Preserved

This deployment does NOT modify any Session 1 or Session 2 artifacts:
- Migration 44 (`is_approved` + security hardening) -- untouched
- Migration 45 (`leagues` table) -- untouched
- Middleware routes list -- already includes `/demo` from Session 2
- AuthContext `isApproved` field -- already deployed from Session 2

### No Downtime Expected

- Migration creates a new table (no locks on existing tables)
- Code deployment is atomic on Vercel (old version serves until new build is ready)
- Auth callback change is additive (try/catch, non-blocking)
- No feature flags needed (demo form is additive, landing page changes are immediate)
- The existing `/demo` stub page will be replaced by the full form -- users see either the old stub or the new form, never a broken state

### Files Changed Summary

**New files (8):**
- `supabase/migrations/20250101000046_create_demo_requests.sql`
- `src/app/actions/submit-demo-request.ts`
- `src/app/actions/platform-demo-requests.ts`
- `src/app/api/demo-requests/mine/route.ts`
- `src/app/(shared)/demo/page.tsx` (replaces stub)
- `src/components/demo/DemoRequestForm.tsx`
- `src/app/platform/demo-requests/page.tsx`
- `src/components/platform/DemoRequestsTable.tsx`

**Modified files (16):**
- `src/lib/constants.ts` -- DEMO_ROLES, DEMO_STATUSES arrays
- `src/lib/validations.ts` -- demoRequestFormSchema
- `src/lib/database.types.ts` -- regenerated
- `src/lib/translations/core.ts` -- ~40 new demo/platform/auth keys
- `src/lib/translations/landing.ts` -- updated CTAs and copy
- `src/app/(auth)/callback/route.ts` -- backfill logic (try/catch)
- `src/app/(auth)/pending/page.tsx` -- pass demo request prop
- `src/components/auth/PendingPolling.tsx` -- show demo status + poll
- `src/components/platform/PlatformSidebar.tsx` -- add demo-requests link + badge
- `src/app/platform/layout.tsx` -- query new count for sidebar
- `src/components/landing/LandingHero.tsx` -- CTAs + copy
- `src/components/landing/HowItWorks.tsx` -- new 3-step flow
- `src/components/landing/AudiencePanels.tsx` -- benefits + CTAs
- `src/components/landing/CtaBanner.tsx` -- CTA + copy
- `src/components/landing/LandingFooter.tsx` -- updated links
- `src/components/about/AboutContent.tsx` -- stale link fix (if needed)
