# Deployment Checklist: Platform Pivot Session 1 -- Strip Routes + Approval Gate

**Date:** 2026-03-24
**Risk Level:** HIGH -- database migration + middleware restructure + route deletions
**Deployment Target:** Vercel (auto-deploy on push) + Supabase remote DB
**Current URL:** https://football-v44v.vercel.app

---

## Known Users (8 profiles)

| Email | Role | Must retain access |
|-------|------|--------------------|
| kvimsina@gmail.com | platform_admin | /platform/* |
| levanitalakhadze0@gmail.com | scout | /dashboard, /clubs |
| torpedo.admin@gfp.ge | academy_admin | /admin/* |
| lukakoridze13@gmail.com | scout | /dashboard, /clubs |
| ggaming5005@gmail.com | scout | /dashboard, /clubs |
| kvimsirius@gmail.com | scout | /dashboard, /clubs |
| gipico.2025@gmail.com | scout | /dashboard, /clubs |
| gioberia223@gmail.com | scout | /dashboard, /clubs |

---

## Data Invariants

These must remain true before AND after deployment:

- [ ] All 8 existing profiles have `is_approved = true` (nobody locked out)
- [ ] `handle_new_user` trigger still fires on signup (new users get `is_approved = false` via column DEFAULT)
- [ ] Profile role distribution unchanged: 6 scouts, 1 academy_admin, 1 platform_admin
- [ ] All existing conversations, messages, watchlists, clubs, players remain intact (no data deletion)
- [ ] RLS policy on profiles still allows self-read (middleware depends on this)

---

## PHASE 1: PRE-DEPLOY AUDITS (Read-Only)

Run these BEFORE touching anything. Save the output -- you will compare post-deploy.

### 1.1 Baseline Profile Counts

```sql
SELECT role, COUNT(*) FROM profiles GROUP BY role ORDER BY role;
```

**Expected:**
```
academy_admin | 1
platform_admin | 1
scout | 6
```

### 1.2 Confirm is_approved Column Does NOT Exist Yet

```sql
SELECT EXISTS(
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'profiles' AND column_name = 'is_approved'
) AS column_exists;
```

**Expected:** `false`
**If true:** Migration already ran. Skip to Phase 3.

### 1.3 Verify Trigger Function Source

```sql
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

**Expected:** INSERT into profiles with columns (id, email, full_name, organization, country, role). No mention of `is_approved` -- it will use column DEFAULT.

### 1.4 Verify RLS Policies on Profiles

```sql
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
```

**Expected:** Two policies:
- "Users can view relevant profiles" (SELECT) -- allows `auth.uid() = id` plus academy_admin scoped reads
- "Users can update own profile" (UPDATE) -- allows `auth.uid() = id`

### 1.5 Baseline Counts for Related Tables (Verify No Data Loss)

```sql
SELECT 'clubs' AS tbl, COUNT(*) FROM clubs
UNION ALL SELECT 'players', COUNT(*) FROM players
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'watchlists', COUNT(*) FROM watchlists
ORDER BY tbl;
```

Save these numbers. They must be identical post-deploy.

---

## PHASE 2: MIGRATION -- Run BEFORE Code Deploy

### CRITICAL ORDERING

```
Migration runs FIRST  -->  Existing middleware ignores new column (safe)
Code deploys SECOND   -->  New middleware reads is_approved column (exists)
```

**If reversed:** New middleware queries `is_approved` on a table that does not have the column. Every authenticated request crashes. ALL users see errors.

### 2.1 Create Backup Branch

```bash
git checkout main
git checkout -b full-platform-backup
git push origin full-platform-backup
git checkout main
```

- [ ] Verify `full-platform-backup` branch exists on remote

### 2.2 Run the Migration

Migration SQL (to be applied via Supabase MCP `apply_migration` or dashboard):

```sql
-- Add is_approved column with safe default
ALTER TABLE profiles ADD COLUMN is_approved boolean DEFAULT false;

-- Backfill ALL existing users to approved (prevent lockout)
UPDATE profiles SET is_approved = true;

-- Update trigger to explicitly set is_approved = false for new signups
-- (redundant with DEFAULT false, but explicit is better)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
begin
  insert into public.profiles (id, email, full_name, organization, country, role, is_approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
    'scout',
    false
  );
  return new;
end;
$$;
```

### 2.3 Post-Migration Verification (Run Immediately After)

```sql
-- Verify column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_approved';
```

**Expected:** `is_approved | boolean | false`

```sql
-- Verify ALL existing users are approved (no lockouts)
SELECT id, email, role, is_approved FROM profiles ORDER BY created_at;
```

**Expected:** All 8 rows show `is_approved = true`.

```sql
-- Verify zero unapproved existing users
SELECT COUNT(*) FROM profiles WHERE is_approved IS NOT true;
```

**Expected:** `0`
**If not 0:** STOP. Run `UPDATE profiles SET is_approved = true;` and re-verify.

```sql
-- Verify role distribution unchanged
SELECT role, COUNT(*) FROM profiles GROUP BY role ORDER BY role;
```

**Expected:** Same as pre-deploy baseline (6 scouts, 1 academy_admin, 1 platform_admin).

```sql
-- Verify trigger function updated
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

**Expected:** Source now includes `is_approved` in the INSERT column list, with value `false`.

```sql
-- Verify column DEFAULT works for new rows
-- (Don't actually insert -- just check the default)
SELECT column_default FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_approved';
```

**Expected:** `false`

### 2.4 Migration Go/No-Go Decision

- [ ] Column exists with correct type and default
- [ ] All 8 existing profiles have `is_approved = true`
- [ ] Trigger function updated with `is_approved` in INSERT
- [ ] Role distribution unchanged

**If ANY check fails:** Do NOT proceed to code deploy. Fix the migration first.

---

## PHASE 3: CODE DEPLOY

### 3.1 Pre-Push Build Verification

```bash
npm run build
```

**Must exit 0 with zero TypeScript errors.** If build fails, do not push.

### 3.2 Verify Deleted Routes Are Gone

```bash
# These directories should NOT exist
ls src/app/(platform)/players/[slug]/ 2>&1    # Should fail
ls src/app/(platform)/matches/[slug]/ 2>&1    # Should fail
ls src/app/dashboard/watchlist/ 2>&1          # Should fail
ls src/app/dashboard/requests/ 2>&1           # Should fail
ls src/app/dashboard/notifications/ 2>&1      # Should fail
ls src/app/api/players/ai-search/ 2>&1        # Should fail
```

### 3.3 Verify Catch-All Redirects Exist

```bash
# These SHOULD exist (redirect to /leagues)
ls src/app/\\(platform\\)/players/\\[\\[...slug\\]\\]/page.tsx
ls src/app/\\(platform\\)/matches/\\[\\[...slug\\]\\]/page.tsx
```

### 3.4 Verify Key Files Modified

- [ ] `src/middleware.ts` -- queries `role, is_approved` for ALL protected routes, approval gate for scouts
- [ ] `src/app/(auth)/callback/route.ts` -- default redirect changed from `/dashboard` to `/pending`
- [ ] `src/app/(auth)/pending/page.tsx` -- new file exists, polls `is_approved`
- [ ] `src/app/(shared)/leagues/page.tsx` -- stub page exists
- [ ] `src/components/layout/Navbar.tsx` -- no `/players` or `/matches` links
- [ ] `src/components/layout/Footer.tsx` -- no `/players` or `/matches` links
- [ ] `src/components/player/PlayerCard.tsx` -- non-clickable (no Link to `/players/slug`)
- [ ] `src/components/chat/PlayerRefCard.tsx` -- non-clickable
- [ ] `src/components/dashboard/DashboardSidebar.tsx` -- only Home + Messages

### 3.5 Push to Deploy

```bash
git push origin main
```

Vercel auto-deploys. Monitor the Vercel deployment log for build errors.

- [ ] Vercel build succeeds (check deployment dashboard or `npx vercel ls`)
- [ ] Deployment URL is live

---

## PHASE 4: POST-DEPLOY VERIFICATION (Within 5 Minutes)

### 4.1 Database Integrity Check

```sql
-- Profiles unchanged
SELECT role, COUNT(*), COUNT(CASE WHEN is_approved THEN 1 END) as approved
FROM profiles GROUP BY role ORDER BY role;
```

**Expected:**
```
academy_admin | 1 | 1
platform_admin | 1 | 1
scout | 6 | 6
```

```sql
-- Related tables unchanged (compare with pre-deploy baseline)
SELECT 'clubs' AS tbl, COUNT(*) FROM clubs
UNION ALL SELECT 'players', COUNT(*) FROM players
UNION ALL SELECT 'matches', COUNT(*) FROM matches
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'watchlists', COUNT(*) FROM watchlists
ORDER BY tbl;
```

**Expected:** Identical to Phase 1.5 baseline.

### 4.2 Route Verification (Manual Browser Tests)

Test with an APPROVED scout account (e.g., levanitalakhadze0@gmail.com):

| Test | URL | Expected |
|------|-----|----------|
| Login | /login | Login form renders |
| Dashboard | /dashboard | Stub dashboard with welcome message |
| Messages | /dashboard/messages | Chat inbox loads |
| Clubs | /clubs | Club listing loads |
| Old players URL | /players | Redirects to /leagues |
| Old player detail | /players/some-slug | Redirects to /leagues |
| Old matches URL | /matches | Redirects to /leagues |
| Old match detail | /matches/some-slug | Redirects to /leagues |
| Leagues stub | /leagues | "Coming soon" page renders |
| Pending page | /pending | Should redirect to /dashboard (user is approved) |

Test with platform_admin (kvimsina@gmail.com):

| Test | URL | Expected |
|------|-----|----------|
| Platform admin | /platform | Platform admin dashboard loads (no approval gate) |
| Dashboard attempt | /dashboard | Redirects to /platform (role mismatch) |

Test with academy_admin (torpedo.admin@gfp.ge):

| Test | URL | Expected |
|------|-----|----------|
| Admin panel | /admin | Admin panel loads (no approval gate) |
| Dashboard attempt | /dashboard | Redirects to /admin (role mismatch) |

### 4.3 Approval Gate Verification

To test the unapproved scout flow, temporarily set one test account to unapproved:

```sql
-- Use a test account you control
UPDATE profiles SET is_approved = false WHERE email = 'kvimsirius@gmail.com';
```

Then test:

| Test | Expected |
|------|----------|
| Login as kvimsirius@gmail.com | Redirected to /pending |
| Navigate to /clubs | Redirected to /pending |
| Navigate to /dashboard | Redirected to /pending |
| /pending page renders | Shows "pending approval" message with demo link |
| /pending polling | Page auto-checks approval status |

**IMPORTANT -- Restore immediately after testing:**

```sql
UPDATE profiles SET is_approved = true WHERE email = 'kvimsirius@gmail.com';
```

Verify restoration:

```sql
SELECT email, is_approved FROM profiles WHERE email = 'kvimsirius@gmail.com';
```

**Expected:** `is_approved = true`

### 4.4 New User Registration Flow

Test with a throwaway email (or use incognito):

1. Go to /register
2. Create a new account
3. **Expected:** After email confirmation callback, redirected to /pending (NOT /dashboard)
4. /pending shows "Account pending approval"
5. Any navigation to /clubs, /dashboard should redirect back to /pending

Verify in DB:

```sql
SELECT email, role, is_approved FROM profiles ORDER BY created_at DESC LIMIT 1;
```

**Expected:** New user has `role = 'scout'`, `is_approved = false`.

Clean up test user if desired:

```sql
-- Only if you created a throwaway test user
-- DELETE FROM profiles WHERE email = 'throwaway@test.com';
-- Then delete from auth.users via Supabase dashboard
```

### 4.5 UI Element Verification

- [ ] Navbar: No "Players" or "Matches" links visible
- [ ] Footer: No "Players" or "Matches" links visible
- [ ] Club detail page: PlayerCard components are NOT clickable (no link to /players/slug)
- [ ] Chat: PlayerRefCard in messages is display-only (no link)
- [ ] Dashboard sidebar: Only "Home" and "Messages" links (no Watchlist, Compare)
- [ ] Avatar dropdown: No "Watchlist" link

### 4.6 Public Pages (No Auth Required)

| URL | Expected |
|-----|----------|
| / | Landing page renders |
| /about | About page renders |
| /contact | Contact page renders |
| /leagues | Leagues stub renders |
| /login | Login form |
| /register | Register form |

These must all work WITHOUT being logged in.

---

## PHASE 5: ROLLBACK PLAN

### Can We Roll Back?

**YES** -- dual-path rollback available.

The migration (ADD COLUMN + UPDATE) is non-destructive. The old middleware does not query `is_approved`, so the column can coexist safely with old code.

### Rollback Scenario A: Code-Only Rollback (Middleware Crashes)

If the new middleware has a bug but the migration is fine:

1. Revert the code commit on main:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. Vercel auto-deploys the revert
3. Old middleware ignores `is_approved` column -- all users work normally
4. The `is_approved` column remains in DB (harmless)

**Time to recover:** ~3 minutes (revert + Vercel build)

### Rollback Scenario B: Full Rollback (Migration + Code)

If the migration itself caused issues:

1. Revert code (same as Scenario A)
2. Drop the column:
   ```sql
   ALTER TABLE profiles DROP COLUMN is_approved;
   ```
3. Restore original trigger:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger
   LANGUAGE plpgsql
   SECURITY DEFINER SET search_path = ''
   AS $$
   begin
     insert into public.profiles (id, email, full_name, organization, country, role)
     values (
       new.id,
       new.email,
       coalesce(new.raw_user_meta_data->>'full_name', ''),
       coalesce(new.raw_user_meta_data->>'organization', ''),
       nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
       'scout'
     );
     return new;
   end;
   $$;
   ```
4. Verify trigger works: `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`

**Time to recover:** ~5 minutes

### Rollback Scenario C: Emergency -- All Users Locked Out

If the backfill failed and all users have `is_approved = false`:

```sql
-- Emergency fix: approve everyone immediately
UPDATE profiles SET is_approved = true;
```

This takes < 1 second for 8 rows. No code revert needed.

### Rollback Scenario D: /pending Page Broken (Infinite Redirect Loop)

If `/pending` redirects back to `/pending` or to `/login`:

1. Check middleware logic: Is `/pending` in the auth-only list (skips approval)?
2. Quick fix: Set all users to approved as emergency:
   ```sql
   UPDATE profiles SET is_approved = true;
   ```
3. Then debug the `/pending` page logic at leisure

---

## PHASE 6: POST-DEPLOY MONITORING (First 24 Hours)

### 6.1 Vercel Dashboard Checks

| Time | Check | How |
|------|-------|-----|
| +0 min | Build succeeded | Vercel deployment dashboard |
| +5 min | No 500 errors | Vercel Runtime Logs (filter: status >= 500) |
| +15 min | No redirect loops | Vercel Runtime Logs (filter: status = 308, count per path) |
| +1 hour | Error rate | Vercel Runtime Logs |
| +4 hours | Error rate | Vercel Runtime Logs |
| +24 hours | Final check | Vercel Runtime Logs |

### 6.2 Database Health Checks (Run at +1h and +24h)

```sql
-- No existing user was accidentally set to unapproved
SELECT COUNT(*) FROM profiles
WHERE is_approved = false
  AND created_at < '2026-03-24 00:00:00+00';
```

**Expected:** `0` (only users created AFTER deploy should be unapproved)

```sql
-- Any new signups since deploy? Check their state
SELECT email, role, is_approved, created_at
FROM profiles
WHERE created_at > '2026-03-24 00:00:00+00'
ORDER BY created_at DESC;
```

**Expected:** New users have `is_approved = false` (the intended gating behavior).

```sql
-- Profile count should only increase (never decrease)
SELECT COUNT(*) FROM profiles;
```

**Expected:** >= 8

### 6.3 Middleware Performance

The restructured middleware now queries `profiles` on EVERY authenticated protected route request (not just role-scoped paths). This adds one DB query per request.

**Impact at current scale (5 active users):** Negligible.

**Watch for:** If Supabase shows elevated query counts on profiles table, this is expected and normal. Only investigate if response times exceed 500ms consistently.

### 6.4 Known Acceptable Issues

These are expected and do NOT require action:

| Issue | Why it is OK |
|-------|-------------|
| `/demo` link on `/pending` returns 404 | `/demo` page is built in Session 3. Low traffic, no real users hitting it yet. |
| Orphan components in `src/components/player/` | Intentionally kept. Will be reused in Session 2+ or cleaned up later. |
| Old bookmarks to `/players/*` redirect to `/leagues` | Intended behavior. `/leagues` stub explains content is coming. |
| Middleware queries profiles on every request | Necessary for approval gate. Acceptable at current scale. |

---

## EXECUTION SUMMARY

```
Step 1:  Create full-platform-backup branch         [~1 min]
Step 2:  Run pre-deploy baseline queries             [~2 min]  -- SAVE OUTPUT
Step 3:  Run migration via Supabase                  [~1 min]
Step 4:  Run post-migration verification queries     [~2 min]  -- GO/NO-GO GATE
Step 5:  npm run build locally                       [~1 min]
Step 6:  git push origin main                        [~1 min]
Step 7:  Wait for Vercel build                       [~2 min]
Step 8:  Run post-deploy verification (Phase 4)      [~10 min]
Step 9:  Test approval gate with test account        [~5 min]
Step 10: Set up monitoring alerts                    [~2 min]
                                            Total:   ~27 min
```

### Go/No-Go Gates

There are two hard gates where you MUST stop if checks fail:

1. **After migration (Step 4):** All 8 profiles must show `is_approved = true`. If not, run emergency backfill before deploying code.
2. **After Vercel build (Step 7):** Build must succeed. If it fails, the old deployment stays live (safe, since migration is backward-compatible).

---

## SIGN-OFF

- [ ] Pre-deploy baseline saved
- [ ] Migration applied and verified
- [ ] Build passes locally
- [ ] Code pushed, Vercel build succeeded
- [ ] All 3 roles tested (scout, academy_admin, platform_admin)
- [ ] Approval gate tested with unapproved account
- [ ] Test account restored to approved
- [ ] New registration flow verified
- [ ] UI elements verified (no dead links)
- [ ] Public pages accessible without auth
- [ ] +1h monitoring check completed
- [ ] +24h monitoring check completed
