---
title: "Platform Pivot Session 4: Privacy/Terms + Dashboard Rewrite + Scouts Admin"
type: feat
status: completed
date: 2026-03-25
origin: docs/superpowers/specs/2026-03-24-platform-pivot-design.md (Section 8, Session 4)
---

# Platform Pivot Session 4: Privacy/Terms + Dashboard Rewrite + Scouts Admin

## Enhancement Summary

**Deepened on:** 2026-03-25
**Research agents used:** 13 — Architecture Strategist, Security Sentinel, Data Integrity Guardian, Data Migration Expert, Performance Oracle, Code Simplicity Reviewer, TypeScript Reviewer, Frontend Races Reviewer, Pattern Recognition Specialist, Best Practices Researcher, Framework Docs Researcher, Supabase DB Reviewer, Fullstack Next.js Reviewer

### Critical Fixes Discovered

1. **CRITICAL (Security): Block `platform_admin` role from signup metadata.** The existing `handle_new_user()` trigger allows `_role = 'platform_admin'` from client-supplied `raw_user_meta_data`. An attacker can self-register as platform admin and bypass the approval gate (middleware only gates scouts). Fix: change role whitelist from `!= 'scout' AND != 'platform_admin'` to `NOT IN ('scout', 'academy_admin')`.
2. **HIGH: Use server-side `now()` instead of client-supplied timestamp for `terms_accepted_at`.** The original plan cast `raw_user_meta_data->>'terms_accepted_at'` to `timestamptz`. A malformed string would crash the trigger and break signup entirely. Server-side `now()` is tamper-proof, legally stronger, and eliminates the cast failure risk.
3. **HIGH: Remove `/privacy` and `/terms` redirects from `next.config.ts`.** Lines 26-28 currently redirect these routes to `/contact`. Creating legal pages without removing these redirects means users would never reach them.

### Key Simplifications

4. **Cut demo status section from dashboard.** By the time a scout reaches the dashboard, they're already approved. Showing "Account fully activated" to an activated user is noise. Saves admin client import + query + 5 translation keys.
5. **Cut "New here?" guide from dashboard.** The dashboard has 2 sections (messages + leagues) that are self-explanatory. A guide describing what the user already sees is redundant. Saves 5 translation keys.
6. **Simplify ScoutsTable to ApprovalButton.** Keep scouts page as a server component. Add a small `ApprovalButton` client component (~25 lines) instead of extracting a full `ScoutsTable` with checkboxes/filters/bulk. Bulk approve and filter tabs are deferred (YAGNI at 3 scouts — add when needed).
7. **Legal pages: English-only body text.** Placeholder legal prose that needs lawyer review should not be translated yet. Translate only page titles and the "Last Updated" label (~4 keys instead of ~20).

### Technical Improvements

8. **Define `ActionResult` discriminated union** for all server actions (TypeScript reviewer).
9. **Validate `approved` boolean with Zod** — server actions are public endpoints (TypeScript reviewer).
10. **Use `.maybeSingle()` instead of `.limit(1).single()`** for dashboard demo request query (Supabase DB reviewer).
11. **Add `.eq('role', 'scout')` to UPDATE queries** to close TOCTOU gap (Data Integrity Guardian).
12. **Add `.select('id')` to updates** for row count verification (Pattern Recognition).
13. **Use `useTransition` pattern** for approval button loading states (Frontend Races, Framework Docs).
14. **Parallelize demo request query** into `Promise.all` — saves one network round-trip (Performance Oracle).

---

## Overview

Final session of the Platform Pivot. Builds legal pages, adds terms acceptance to registration, rewrites the scout dashboard for the portal model, and upgrades `/platform/scouts` with approve/revoke actions. Ends with Vercel deployment.

**Depends on:** Sessions 1-3 complete (approval gate, leagues, demo requests, landing redesign).

## Proposed Solution

5 phases, 8 tasks.

| Phase | Tasks | New Files | Modified Files |
|-------|-------|-----------|----------------|
| A: Migration | 1 | `migrations/000047_*.sql` | — |
| B: Legal Pages + Terms | 2-3 | `privacy/page.tsx`, `terms/page.tsx` | `RegisterForm.tsx`, `LandingFooter.tsx`, `next.config.ts`, translations |
| C: Dashboard Rewrite | 4 | — | `dashboard/page.tsx`, translations |
| D: Scouts Admin | 5-6 | `platform-scouts.ts` action, `ApprovalButton.tsx` | `scouts/page.tsx`, `scouts/[id]/page.tsx`, translations |
| E: Polish + Deploy | 7-8 | — | — |

---

## Phase A: Migration

### Task 1: Add `terms_accepted_at` column + fix trigger security + update trigger

**File:** `supabase/migrations/20250101000047_add_terms_accepted_at.sql`

**Why `terms_accepted_at`:** Legal compliance — proves when a user agreed to terms. Stored server-side via `now()` in the `handle_new_user()` trigger when the `terms_accepted_at` key is present in signup metadata. Cannot be spoofed because the timestamp comes from the database server, not the client.

```sql
BEGIN;

-- Add terms acceptance timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Backfill existing users (they implicitly accepted by using the platform)
UPDATE public.profiles SET terms_accepted_at = created_at WHERE terms_accepted_at IS NULL;

-- Update handle_new_user() — ALSO fixes critical security issue:
-- Old trigger allowed platform_admin role from signup metadata.
-- New trigger only allows 'scout' and 'academy_admin' from metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _role text;
  _club_id uuid;
  _is_approved boolean;
  _club_exists boolean;
BEGIN
  _role := coalesce(new.raw_user_meta_data->>'role', 'scout');
  _club_id := nullif(trim(coalesce(new.raw_user_meta_data->>'club_id', '')), '')::uuid;

  IF _role = 'academy_admin' AND _club_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.clubs WHERE id = _club_id) INTO _club_exists;
    IF _club_exists THEN
      _is_approved := true;
    ELSE
      _role := 'scout';
      _club_id := NULL;
      _is_approved := false;
    END IF;
  ELSE
    _is_approved := false;
    -- SECURITY FIX: only allow known safe roles from metadata
    -- platform_admin must NEVER come from signup — only manual DB assignment
    IF _role NOT IN ('scout', 'academy_admin') THEN
      _role := 'scout';
    END IF;
    _club_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, organization, country, role, club_id, is_approved, terms_accepted_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), ''),
    _role,
    _club_id,
    _is_approved,
    -- Server-authoritative timestamp: use now() when metadata key exists.
    -- Never trust client-provided timestamps for legal consent records.
    -- The key's presence signals checkbox was checked; server stamps when.
    CASE WHEN new.raw_user_meta_data ? 'terms_accepted_at' THEN now() ELSE NULL END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

**Key changes from original plan:**
- **Security fix:** Role whitelist changed from `!= 'scout' AND != 'platform_admin'` to `NOT IN ('scout', 'academy_admin')`. This blocks self-registration as `platform_admin` — a critical vulnerability in the existing trigger.
- **Server-side `now()`:** Instead of parsing client timestamp with `::timestamptz` cast (which could crash on malformed input), we use `CASE WHEN new.raw_user_meta_data ? 'terms_accepted_at' THEN now() ELSE NULL END`. The `?` operator checks if the key exists in the JSONB, without parsing the value.

**Column-level GRANT:** `terms_accepted_at` is NOT in the `GRANT UPDATE` list from migration 044. Only the service role (trigger, admin client) can write it. Correct and intentional.

**After migration:** Run `npx supabase gen types typescript --local > src/lib/database.types.ts`

---

## Phase B: Legal Pages + Terms Checkbox

### Task 2: Build `/privacy` and `/terms` pages

**PREREQUISITE: Remove redirects from `next.config.ts`.** Lines 26-28 currently redirect `/privacy` and `/terms` to `/contact`. Delete these redirect entries before creating the pages.

**Pattern:** Same as `(shared)/about/page.tsx` — server component with Metadata export.

**New files:**
- `src/app/(shared)/privacy/page.tsx` — server component
- `src/app/(shared)/terms/page.tsx` — server component

**Both pages must export `Metadata`:**
```typescript
export const metadata: Metadata = {
  title: 'Privacy Policy | GFT',
  description: '...',
}
```

**Page structure (both pages):**
```
mx-auto max-w-3xl px-4 py-12
  ├── h1 (title — translated)
  ├── p.text-foreground-muted (last updated date — translated label, hardcoded date)
  ├── {/* DRAFT — replace with legal review before launch */}
  └── sections (h2 + p for each policy section — English only for now)
```

**Privacy Policy sections (8):**
1. Introduction — data controller identity, platform description
2. Information We Collect — account data, usage data, camera/analytics data
3. How We Use Your Information — platform operation, scouting, analytics
4. Data Sharing — with academies, scouts, Starlive/Pixellot, Supabase, Vercel
5. Data Retention — how long we keep data
6. Your Rights — access, deletion, correction (GDPR + Georgian data protection law)
7. Cookies — what cookies we use (language pref, auth session)
8. Contact — how to reach us

**Georgian law specifics to include:** 10-working-day response deadline for data subject requests (stricter than GDPR's 30 days). PDPS as the supervisory authority. Under-16 parental consent requirement for youth player data.

**Terms of Service sections (9):**
1. Acceptance of Terms
2. Account Registration — roles, responsibilities
3. Acceptable Use — no scraping, no harassment, no bypassing platform for direct contact
4. Intellectual Property — platform content, player data ownership
5. Camera Data Disclaimer — stats provided by Pixellot via Starlive; platform does not guarantee accuracy
6. Limitation of Liability — cap at 12 months of fees paid
7. Termination — we can revoke access
8. Governing Law — Georgia. English version prevails in case of conflict with Georgian translation
9. Contact

**Content approach:** English-only body text with real structure and brief descriptions per section. Clearly marked as DRAFT. Georgian translation deferred until legal review is complete.

**Translation keys** (add to `core.ts` — only 4 keys, not full content):
- `privacy.title`: "Privacy Policy" / "კონფიდენციალურობის პოლიტიკა"
- `privacy.lastUpdated`: "Last Updated" / "ბოლო განახლება"
- `terms.title`: "Terms of Service" / "მომსახურების პირობები"
- `terms.lastUpdated`: "Last Updated" / "ბოლო განახლება"

**Also update:**
- `LandingFooter.tsx` — add Privacy Policy and Terms links using existing `t('footer.privacy')` and `t('footer.terms')` keys
- `next.config.ts` — remove `/privacy` and `/terms` redirect entries

### Task 3: Add terms checkbox to RegisterForm

**File:** `src/components/auth/RegisterForm.tsx`

**Changes:**
1. Add state: `const [agreedToTerms, setAgreedToTerms] = useState(false)`
2. Add checkbox between the divider and submit button:
   ```tsx
   <label className="flex items-start gap-2 cursor-pointer">
     <input
       type="checkbox"
       required
       checked={agreedToTerms}
       onChange={(e) => setAgreedToTerms(e.target.checked)}
       className="mt-1 h-4 w-4 rounded border-border accent-primary"
     />
     <span className="text-xs text-foreground-muted">
       {t('auth.agreePrefix')}{' '}
       <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
         {t('footer.terms')}
       </Link>{' '}
       {t('auth.agreeAnd')}{' '}
       <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
         {t('footer.privacy')}
       </Link>
     </span>
   </label>
   ```
3. Update submit button: `disabled={loading || !agreedToTerms}`
4. Pass signal (not timestamp) in signUp metadata:
   ```tsx
   data: {
     full_name: fullName,
     organization,
     country: country || undefined,
     terms_accepted_at: 'true',  // Signal only — trigger uses now() for the actual timestamp
   }
   ```

**Note:** `accent-primary` is the first checkbox in the codebase. Verify rendering in both light and dark themes during testing.

**Links open in new tab** (`target="_blank"`) to preserve form state. If signup fails, checkbox remains checked (correct — user already agreed; network hiccup should not force re-consent).

**Translation keys** (add to `core.ts`):
- `auth.agreePrefix`: "I agree to the" / "ვეთანხმები"
- `auth.agreeAnd`: "and" / "და"

**Also update `auth.orContinue` text** — current text references removed features ("browse players, build your watchlist, and contact academies"). Change to: "Scout registration — explore leagues, message academies, and discover Georgian talent."

---

## Phase C: Dashboard Rewrite

### Task 4: Rewrite scout dashboard page

**File:** `src/app/dashboard/page.tsx` (full rewrite)

**Data fetching** (all server-side, all parallel):
```typescript
const admin = createAdminClient()

const [
  { data: profile, error: profileErr },
  { data: leagues, error: leaguesErr },
  { data: unreadCount, error: unreadErr },
] = await Promise.all([
  supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  supabase.from('leagues').select('*').eq('is_active', true).order('display_order').limit(3),
  supabase.rpc('get_total_unread_count'),
])
```

**Key changes from original plan:**
- **Removed demo request query** — scouts on the dashboard are already approved; showing demo status is noise (Simplicity reviewer)
- **Removed "New here?" guide** — dashboard has 2 sections that are self-explanatory (Simplicity reviewer)
- **All queries now parallel** — no sequential admin client call (Performance Oracle)
- **Error results destructured** — check each `.error` explicitly (TypeScript reviewer)

**Layout structure (simplified):**
```
py-8 space-y-8
  ├── Welcome card (h1 + scout name)
  ├── Messages card (unread count + link to /dashboard/messages)
  └── Leagues section (h2 + grid of LeagueCard components, limit 3)
      ├── League cards
      └── "View All Leagues" link → /leagues
      └── Empty state if no leagues
```

**Key decisions:**
- `LeagueCard` is an async server component — works directly inside the server page. Sibling async server components resolve in parallel (confirmed by Framework Docs researcher).
- No `createAdminClient()` needed — all queries use the regular client (profile + leagues + unread RPC)
- `.limit(3)` on leagues query — dashboard shows top 3, links to `/leagues` for all

**New translation keys** (add to `admin.ts` under `dashboard.*` — 6 keys):
- `dashboard.messagesCard`: "Messages" / "შეტყობინებები"
- `dashboard.unreadCount`: "unread" / "წაუკითხავი"
- `dashboard.viewMessages`: "View Messages" / "შეტყობინებების ნახვა"
- `dashboard.leaguesSection`: "Georgian Youth Leagues" / "საქართველოს ახალგაზრდული ლიგები"
- `dashboard.viewAllLeagues`: "View All Leagues" / "ყველა ლიგის ნახვა"
- `dashboard.noLeagues`: "No leagues available yet" / "ლიგები ჯერ არ არის ხელმისაწვდომი"

**Also update `auth.orContinue`** (remove stale feature references — see Task 3).

---

## Phase D: Platform Scouts Admin

### Task 5: Create server action for approve/revoke

**New file:** `src/app/actions/platform-scouts.ts`

**First, define shared `ActionResult` type** in `src/lib/types.ts` (or reuse if already exists):
```typescript
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }
```

Pattern follows `platform-demo-requests.ts` with improvements from TypeScript and Data Integrity reviews.

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema } from '@/lib/validations'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types'

const toggleSchema = z.object({
  scoutId: uuidSchema,
  approved: z.boolean(),
})

export async function toggleScoutApproval(
  scoutId: string,
  approved: boolean
): Promise<ActionResult> {
  const parsed = toggleSchema.safeParse({ scoutId, approved })
  if (!parsed.success) return { success: false, error: 'errors.invalidInput' }

  const { error: authErr, admin, userId } = await getPlatformAdminContext()
  if (authErr || !admin) return { success: false, error: authErr ?? 'errors.unauthorized' }

  // Prevent self-revocation (would lock admin out)
  if (parsed.data.scoutId === userId && !parsed.data.approved) {
    return { success: false, error: 'platform.scouts.cannotRevokeSelf' }
  }

  // Verify target is a scout (defense-in-depth)
  const { data: target, error: targetErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', parsed.data.scoutId)
    .single()

  if (targetErr || !target) {
    console.error('[platform-scouts] Profile lookup error:', targetErr?.message)
    return { success: false, error: 'errors.serverError' }
  }
  if (target.role !== 'scout') {
    return { success: false, error: 'platform.scouts.notAScout' }
  }

  // Update with role guard to close TOCTOU gap + select for row verification
  const { data: updated, error } = await admin
    .from('profiles')
    .update({ is_approved: parsed.data.approved })
    .eq('id', parsed.data.scoutId)
    .eq('role', 'scout')  // Defense-in-depth: closes TOCTOU gap
    .select('id')

  if (error) {
    console.error('[platform-scouts] Toggle approval error:', error.message)
    return { success: false, error: 'errors.serverError' }
  }
  if (!updated?.length) return { success: false, error: 'platform.scouts.notFound' }

  revalidatePath('/platform/scouts')
  revalidatePath('/pending')
  return { success: true }
}
```

**Key improvements from reviews:**
- `ActionResult` discriminated union — callers narrow on `result.success` (TypeScript reviewer)
- `approved` boolean validated via Zod (TypeScript reviewer)
- `.error` from lookup query checked separately from role check — DB failure ≠ business logic error (TypeScript reviewer)
- `.eq('role', 'scout')` on UPDATE closes TOCTOU gap (Data Integrity Guardian)
- `.select('id')` on UPDATE verifies row was actually updated (Pattern Recognition)

**Bulk approve deferred (YAGNI).** With 3 scouts, clicking "Approve" individually takes under 5 seconds. Add bulk when scout count warrants it — the server action is ~30 lines and can be added in minutes (Simplicity reviewer).

### Task 6: Upgrade `/platform/scouts` page + detail page

**Architecture:** Keep scouts page as a server component. Add a small `ApprovalButton` client component (~25 lines) for the approve/revoke button.

**File:** `src/app/platform/scouts/page.tsx` (modify, keep as server component)

Changes:
1. Add `is_approved` to the scouts SELECT query
2. Add `country` to the scouts SELECT query
3. Add status badge column (green "Approved" / amber "Pending")
4. Add `ApprovalButton` in actions column
5. Show pending/approved counts at top of page
6. Use `searchParams: Promise<{ status?: string }>` if adding filter (optional)

**New file:** `src/components/platform/ApprovalButton.tsx` (client component, ~25 lines)

Uses `useTransition` pattern (matching `DemoRequestsTable.tsx`):
```typescript
'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleScoutApproval } from '@/app/actions/platform-scouts'
import { useLang } from '@/hooks/useLang'

interface ApprovalButtonProps {
  scoutId: string
  isApproved: boolean
}

export function ApprovalButton({ scoutId, isApproved }: ApprovalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { t } = useLang()

  function handleClick() {
    startTransition(async () => {
      const result = await toggleScoutApproval(scoutId, !isApproved)
      if (result.success) router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium px-2 py-1 rounded ${
        isApproved
          ? 'text-danger hover:bg-danger/10'
          : 'text-primary hover:bg-primary/10'
      } disabled:opacity-50`}
    >
      {isPending ? t('common.loading') : isApproved ? t('platform.scouts.revoke') : t('platform.scouts.approve')}
    </button>
  )
}
```

**Key decisions (from reviews):**
- `useTransition` instead of manual `useState(loading)` — `isPending` tracks the full transition including revalidation (Framework Docs, Frontend Races reviewers)
- `router.refresh()` does NOT remount client components — state is preserved via React reconciliation (confirmed by multiple agents)
- Server action already calls `revalidatePath` — `router.refresh()` ensures the current page re-fetches immediately

**File:** `src/app/platform/scouts/[id]/page.tsx` (update)

Changes:
1. Add `is_approved` to the scout SELECT query
2. Show approval status badge in the info card
3. Add `ApprovalButton` component — same one used in the list page

**New translation keys** (add to `admin.ts` under `platform.scouts.*` — 8 keys):
- `platform.scouts.status`: "Status" / "სტატუსი"
- `platform.scouts.approved`: "Approved" / "დამტკიცებული"
- `platform.scouts.pending`: "Pending" / "მოლოდინში"
- `platform.scouts.approve`: "Approve" / "დამტკიცება"
- `platform.scouts.revoke`: "Revoke" / "გაუქმება"
- `platform.scouts.cannotRevokeSelf`: "Cannot revoke your own access" / "საკუთარი წვდომის გაუქმება შეუძლებელია"
- `platform.scouts.notAScout`: "Target user is not a scout" / "მომხმარებელი არ არის სკაუტი"
- `platform.scouts.notFound`: "Scout not found" / "სკაუტი ვერ მოიძებნა"

---

## Phase E: Polish + Deploy

### Task 7: Responsive testing + build verification

1. `npm run build` — must be clean (zero TS errors, zero lint warnings)
2. Regenerate DB types if not already done: `npx supabase gen types typescript --local > src/lib/database.types.ts`
3. Verify `accent-primary` checkbox renders correctly in both light and dark themes
4. Visual check at 375px, 768px, 1280px for:
   - `/privacy` and `/terms` pages
   - `/register` with terms checkbox
   - `/dashboard` new layout
   - `/platform/scouts` with approve/revoke buttons
5. Test flows:
   - Register with checkbox → email confirmation → callback → pending
   - Platform admin approve scout → scout dashboard loads correctly
   - Platform admin revoke → scout redirected to /pending on next navigation
   - Verify `/privacy` and `/terms` are NOT redirected to `/contact`

### Task 8: Deploy to Vercel

1. Push migration to remote Supabase: `npx supabase db push`
2. Regenerate types from remote (for safety): `npx supabase gen types typescript --project-id jodnjhqnoawsxigrxqgv > src/lib/database.types.ts`
3. `npm run build` one final time
4. Deploy: `npx vercel --prod --force`
5. Verify on production URL: `https://football-v44v.vercel.app`
   - Legal pages render (not redirected)
   - Register shows checkbox
   - Dashboard shows new layout
   - Scouts admin shows approve/revoke

---

## Files Changed Summary

### New Files (4)
| File | Purpose |
|------|---------|
| `supabase/migrations/20250101000047_add_terms_accepted_at.sql` | Migration: `terms_accepted_at` column + security fix + trigger update |
| `src/app/(shared)/privacy/page.tsx` | Privacy Policy page |
| `src/app/(shared)/terms/page.tsx` | Terms of Service page |
| `src/app/actions/platform-scouts.ts` | Server action: toggleScoutApproval |

### Modified Files (10)
| File | Change |
|------|--------|
| `next.config.ts` | Remove `/privacy` and `/terms` redirects to `/contact` |
| `src/components/auth/RegisterForm.tsx` | Add terms checkbox + metadata signal |
| `src/components/landing/LandingFooter.tsx` | Add privacy/terms links |
| `src/app/dashboard/page.tsx` | Full rewrite: welcome + messages + leagues |
| `src/app/platform/scouts/page.tsx` | Add is_approved, country, ApprovalButton |
| `src/app/platform/scouts/[id]/page.tsx` | Add approval status + ApprovalButton |
| `src/lib/types.ts` | Add `ActionResult` discriminated union type |
| `src/lib/translations/core.ts` | Privacy, terms, auth keys (~6 EN + KA) |
| `src/lib/translations/admin.ts` | Dashboard, scouts keys (~14 EN + KA) |
| `src/lib/database.types.ts` | Regenerated (terms_accepted_at column) |

---

## Acceptance Criteria

### Functional
- [x] `/privacy` page renders with English draft content and "Last Updated" date
- [x] `/terms` page renders with English draft content and "Last Updated" date
- [x] `/privacy` and `/terms` are NOT redirected (config redirects removed)
- [x] LandingFooter has links to `/privacy` and `/terms`
- [x] Register form has terms checkbox that must be checked to submit
- [x] `terms_accepted_at` is stored in profiles via `handle_new_user()` trigger using server-side `now()`
- [x] `handle_new_user()` blocks `platform_admin` role from signup metadata
- [x] Dashboard shows: welcome card, messages count, league cards (max 3)
- [x] Platform scouts page shows approval status per scout
- [x] Platform scouts page shows pending/approved counts
- [x] Approve/Revoke button works per scout with loading state via `useTransition`
- [x] Self-revocation is prevented with error message
- [x] Scout detail page shows approval status + approve/revoke button
- [x] All new strings have EN + KA translations

### Non-Functional
- [x] `npm run build` passes with zero errors
- [x] All pages responsive at 375px+
- [x] All action buttons have disabled/loading states
- [ ] Deployed to Vercel and verified

---

## Technical Considerations

**Server-side `now()` for terms:** The trigger checks `new.raw_user_meta_data ? 'terms_accepted_at'` (JSONB key existence operator). The client sends `terms_accepted_at: 'true'` as a signal. The trigger stamps `now()` — tamper-proof and legally robust.

**Security fix in trigger:** Changed role whitelist to `NOT IN ('scout', 'academy_admin')`. This blocks `platform_admin` from signup metadata. The existing middleware only gates scouts for approval — a self-registered `platform_admin` would bypass all gates.

**ApprovalButton architecture:** Small client component (~25 lines) used in both scouts list and detail pages. Uses `useTransition` for `isPending` tracking. `router.refresh()` preserves client state via React reconciliation (not a full remount).

**No separate migration for scouts page:** The `is_approved` column already exists (migration 044). No DB changes needed for the scouts feature.

**Dashboard simplification:** Removed demo status section (scout is already approved when they see the dashboard) and guide section (dashboard is self-explanatory). This eliminates the need for `createAdminClient()` in the dashboard page entirely.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Legal text is placeholder | Marked "DRAFT" clearly; real legal review needed before launch. Georgian translation deferred. |
| `handle_new_user()` trigger rewrite could break signup | Trigger is backward-compatible: new column is nullable, `now()` is safe. Security fix is strictly additive. |
| `next.config.ts` redirect removal could be missed | Added to Task 2 prerequisites and Task 7 test checklist. |
| Admin locks themselves out via self-revoke | Server action explicitly prevents this with userId check. |
| `accent-primary` is new CSS pattern | Test in both light/dark themes (Task 7). |

---

## Deferred Items (add when needed)

- **Bulk approve** — Add when scout count warrants it (~30 LOC server action + ~60 LOC UI)
- **Filter tabs** (All/Pending/Approved) — Add when scouts list exceeds one screen
- **Legal content translations** — Translate to Georgian after legal review
- **Terms versioning** — Add `terms_version` column when terms actually change
- **Re-consent flow** — Build `/accept-terms` blocking page when terms are updated
- **Audit logging** — `admin_audit_log` table for approval/revocation actions
- **Password strength** — Server-side validation beyond minLength 6
- **Next.js upgrade** — Patch CVE-2026-27978 before deploying public forms to production
