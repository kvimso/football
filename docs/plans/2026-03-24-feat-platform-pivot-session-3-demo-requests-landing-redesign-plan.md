---
title: "feat: Platform Pivot Session 3 — Demo Requests + Landing Redesign"
type: feat
status: completed
date: 2026-03-24
origin: docs/superpowers/specs/2026-03-24-platform-pivot-design.md
---

# Platform Pivot Session 3 — Demo Requests + Landing Redesign

## Enhancement Summary

**Deepened on:** 2026-03-24
**Sections enhanced:** All 10 tasks across 4 phases
**Review agents used:** Architecture Strategist, Security Sentinel, Data Integrity Guardian, Performance Oracle, Code Simplicity Reviewer, TypeScript Reviewer, Frontend Races Reviewer, Pattern Recognition Specialist, Framework Docs Researcher, Deployment Verification Agent

### Key Improvements
1. **Migration hardened:** PL/pgSQL function replaces broken `.limit(1)` UPDATE, `ON DELETE SET NULL` added, RLS enabled as defense-in-depth, idempotent with `IF NOT EXISTS`, reuses existing `update_updated_at_column()` trigger
2. **Simplified scope:** Cut `/api/demo-requests/mine` route (use `router.refresh()`), cut `admin_notes` column (YAGNI), cut sidebar badge (just add link), cut 3 of 4 indexes, inlined `approveDemoAccount` into status update action
3. **Security fixes:** Honeypot server-side check specified, rate limiting defined, role verification on approve, `user.email` guard, Next.js CSRF upgrade flagged (16.1.7+)
4. **Pattern alignment:** API route uses `apiSuccess`/`apiError` from `api-utils.ts`, `platform.*` translations go in `admin.ts`, `uuidSchema` validation on all ID params, `metadata` export on `/demo` page

### Simplifications Applied (from Simplicity Reviewer)
- **CUT** `/api/demo-requests/mine` API route → use `router.refresh()` in PendingPolling (−30 LOC)
- **CUT** `admin_notes` column + action + UI (−40 LOC, add later if needed)
- **CUT** counter badge in PlatformSidebar (−25 LOC, just add the link)
- **CUT** 3 of 4 indexes (keep only `user_id` partial index; table will have <50 rows)
- **CUT** seed data for demo_requests (test by submitting form)
- **INLINED** `approveDemoAccount` into `updateDemoRequestStatus` when status=converted (−20 LOC)
- **Total:** ~145 LOC cut, ~20 fewer translation keys

### Critical Fixes from Review Agents
- `.limit(1)` on Supabase UPDATE is a **no-op** — does not limit affected rows. Use PL/pgSQL function with subquery LIMIT instead.
- Missing `ON DELETE SET NULL` on `user_id` FK — would block user deletion from `auth.users`.
- Missing `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — defense-in-depth against accidental re-grants.
- API route must use `createApiClient(request)` + `apiSuccess()`/`apiError()` from `api-utils.ts` — not raw `NextResponse.json()`.
- `platform.*` translation keys belong in `admin.ts`, not `core.ts`.
- Next.js 16.1.6 has CSRF vulnerability (CVE-2026-27978) — upgrade to 16.1.7+ before deploying public forms.

---

## Overview

Build the demo request system (public form + platform admin management) and redesign the landing page to reflect the portal model. This session turns the platform from a registration-first funnel into a demo-driven sales funnel: visitors request a demo, get a walkthrough, then get approved.

**Session 1** (complete): Stripped data-dependent routes, added approval gate, built `/pending` page.
**Session 2** (complete): Built leagues system, overhauled navigation.
**This session**: Demo requests + landing redesign.
**Session 4** (next): Privacy/terms pages, dashboard rewrite, scout management enhancements, final polish.

## Problem Statement

The platform currently has:
- A `/demo` stub page showing "Demo request form coming soon. Contact us at info@gft.ge"
- Landing page content still referencing the old scouting model (watchlists, player comparison, advanced filters, AI search)
- No way for the platform admin to manage demo requests or track the sales funnel
- `/pending` page shows generic "pending approval" with no demo request status

Users need a real demo request form, and the landing page must reflect what the platform actually offers today.

## Proposed Solution

### Phase A: Database + Server Actions (2 tasks)
1. Migration: `demo_requests` table with RLS + REVOKE, PL/pgSQL backfill function, `updated_at` trigger
2. Zod validation schema + server actions (public submit with rate limit + admin management with auto-approve)

### Phase B: Demo Request Pages (3 tasks)
3. `/demo` page — form with value prop, Zod validation, honeypot
4. `/platform/demo-requests` — admin management table with status workflow
5. PlatformSidebar update — add "Demo Requests" link

### Phase C: Auth + Pending Page Integration (2 tasks)
6. Auth callback backfill — `backfill_demo_request()` RPC to link `user_id` on email confirmation
7. PendingPolling enhancement — show demo request status via `router.refresh()` + server prop

### Phase D: Landing Page Redesign (2 tasks)
8. Update all landing components — CTAs, copy, feature references
9. Translation key updates — all changed text in EN + KA (in correct files: `core.ts`, `admin.ts`, `landing.ts`)

---

## Technical Approach

### Architecture

```
demo_requests table (REVOKE + RLS enabled, zero policies — service role only)
    ↓ INSERT
submit-demo-request.ts (server action, uses createAdminClient())
    ↑ form submit
/demo page (public, Zod validation, honeypot, rate limit)

demo_requests table
    ↓ SELECT/UPDATE (+ auto-approve on converted)
platform-demo-requests.ts (server action, uses getPlatformAdminContext())
    ↑ admin actions
/platform/demo-requests page (platform_admin only)

demo_requests table
    ↓ SELECT (by user_id, server-side in pending/page.tsx)
    ↓ passed as initialDemoRequest prop
PendingPolling component (polls via router.refresh() every 30s)

auth callback → backfill_demo_request() RPC → links user_id to existing request
```

### Key Design Decisions

1. **REVOKE + RLS on `demo_requests`** — all access via service role client. REVOKE prevents direct access, RLS (zero policies) provides defense-in-depth. No client-facing read path — the pending page fetches server-side via admin client and passes as prop.

2. **Duplicate prevention** — When logged in, check for existing `user_id` match before showing the form. If a linked request exists, show status instead. Anonymous duplicates are allowed (no reliable way to deduplicate without auth).

3. **`/register` route stays functional** — Registration is still needed as the actual account creation step. But all navigation/CTA links change from `/register` to `/demo`. The flow becomes: request demo → demo call → register → get approved.

4. **"Approve Account" is scout-only** — It sets `is_approved = true` on the profile. Academy admin role assignment still requires the existing invite flow at `/platform/invite`. A tooltip on the button clarifies this.

5. **Counter badge counts `status = 'new'` only** — Things that need admin attention, matching the existing "unread" badge pattern.

6. **Country field uses `SCOUT_COUNTRIES` dropdown** — Consistent with registration form, ensures data quality.

7. **Pricing ranges from spec** — EUR 1,990/year (club), EUR 490/year (scout), EUR 350/month (academy). Display only, bilingual.

---

## Implementation Phases

### Phase A: Database + API Foundation

#### Task 1: Migration — `demo_requests` table

**File:** `supabase/migrations/20250101000046_create_demo_requests.sql`

(Note: `000045` is already taken by the leagues table from Session 2.)

```sql
BEGIN;

-- Demo request table for lead capture
create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  organization text not null,
  role text not null check (role in ('Scout', 'Club Sporting Director', 'Agent', 'Academy Director', 'Other')),
  country text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'demo_done', 'converted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Defense-in-depth: enable RLS even though we use REVOKE
-- Zero policies = no rows returned even if REVOKE is accidentally reversed
alter table demo_requests enable row level security;

-- REVOKE direct access from anon, authenticated, AND public roles
revoke all on demo_requests from anon, authenticated, public;

-- Single index: user_id partial (only index needed at <50 rows)
create index if not exists idx_demo_requests_user_id on demo_requests(user_id) where user_id is not null;

-- Reuse existing generic updated_at trigger (from migration 000011)
drop trigger if exists trg_demo_requests_updated_at on demo_requests;
create trigger trg_demo_requests_updated_at
  before update on demo_requests
  for each row execute function public.update_updated_at_column();

-- PL/pgSQL function for safe single-row backfill (JS .limit(1) on UPDATE is a no-op)
create or replace function public.backfill_demo_request(p_user_id uuid, p_email text)
returns void as $$
begin
  update demo_requests
  set user_id = p_user_id
  where id = (
    select id from demo_requests
    where user_id is null and lower(email) = lower(p_email)
    order by created_at desc
    limit 1
    for update skip locked
  );
end;
$$ language plpgsql security definer;

COMMIT;
```

### Research Insights (Task 1)

**From Data Integrity Guardian:**
- `ON DELETE SET NULL` preserves the demo request as CRM history when a user account is deleted (unlike `NO ACTION` which blocks deletion)
- `IF NOT EXISTS` on table + indexes makes migration idempotent for local development reruns
- The PL/pgSQL `backfill_demo_request()` function uses a subquery with `LIMIT 1 FOR UPDATE SKIP LOCKED` — this is the only reliable way to limit UPDATE scope in Supabase/PostgREST
- Reusing `update_updated_at_column()` (from migration 000011) avoids duplicate trigger functions — every other table in the project uses this same function

**From Security Sentinel:**
- `REVOKE ALL ... FROM anon, authenticated, public` — include `public` role per Supabase advisor lint rule 0017
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with zero policies = belt-and-suspenders protection against accidental re-grants

**From Simplicity Reviewer:**
- Cut `admin_notes` column — YAGNI for solo developer. Add later with `ALTER TABLE demo_requests ADD COLUMN admin_notes text`
- Cut 3 of 4 indexes — at <50 rows, sequential scans are microseconds. Keep only `user_id` partial index for backfill correctness
- Cut seed data — test by submitting the form (15 seconds, exercises real code path)

**After migration:** Regenerate types: `npx supabase gen types typescript --local > src/lib/database.types.ts`

**Verification:**
- [x] Table created with all columns
- [x] CHECK constraints on `role` and `status`
- [x] `ON DELETE SET NULL` on `user_id` FK
- [x] RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [x] REVOKE confirmed (anon/authenticated/public cannot query)
- [x] `user_id` partial index created
- [x] `updated_at` trigger uses existing `update_updated_at_column()`
- [x] `backfill_demo_request()` function created
- [x] Types regenerated

---

#### Task 2: Zod Schema + Server Actions

**File:** `src/lib/constants.ts` — add role and status enums:

```typescript
export const DEMO_ROLES = ['Scout', 'Club Sporting Director', 'Agent', 'Academy Director', 'Other'] as const
export const DEMO_STATUSES = ['new', 'contacted', 'demo_done', 'converted', 'declined'] as const
```

**File:** `src/lib/types.ts` — derive types from const arrays (TypeScript Reviewer):

```typescript
export type DemoRole = (typeof DEMO_ROLES)[number]
export type DemoStatus = (typeof DEMO_STATUSES)[number]

// For PendingPolling prop
export interface DemoRequestSummary {
  id: string
  status: DemoStatus
  created_at: string
}
```

**File:** `src/lib/validations.ts` — add `demoRequestFormSchema`:

```typescript
import { DEMO_ROLES } from '@/lib/constants'

export const demoRequestFormSchema = z.object({
  full_name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  organization: z.string().min(1).max(200),
  role: z.enum(DEMO_ROLES),
  country: z.string().min(1).max(100),
  message: z.string().max(2000).optional().or(z.literal('')),
})
```

**File:** `src/app/actions/submit-demo-request.ts` — public server action:

Pattern: Uses `createAdminClient()` (service role) since `demo_requests` has REVOKE on anon/authenticated.
**Note:** This differs from `contact-message.ts` which uses `createClient()` — add a code comment explaining why admin client is needed here.

```typescript
'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { demoRequestFormSchema } from '@/lib/validations'
import type { z } from 'zod'

type DemoRequestInput = z.infer<typeof demoRequestFormSchema>

export async function submitDemoRequest(data: DemoRequestInput, honeypot?: string) {
  // Honeypot: if filled, silently succeed (don't reveal detection to bots)
  if (honeypot) return { success: true as const }

  // Validate
  const parsed = demoRequestFormSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'errors.invalidInput' }

  // Get current user if logged in (optional)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Service role client required — demo_requests has REVOKE on anon/authenticated
  const admin = createAdminClient()

  // Duplicate check: if logged in and already has a linked request
  if (user) {
    const { data: existing } = await admin
      .from('demo_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) {
      return { error: 'demo.alreadySubmitted' }
    }
  }

  // Rate limit: max 3 submissions per email per hour
  const { count } = await admin
    .from('demo_requests')
    .select('id', { count: 'exact', head: true })
    .eq('email', parsed.data.email.toLowerCase())
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if (count && count >= 3) return { error: 'errors.rateLimitContact' }

  // Insert (normalize email to lowercase for consistent matching)
  const { error } = await admin.from('demo_requests').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email.toLowerCase(),
    organization: parsed.data.organization,
    role: parsed.data.role,
    country: parsed.data.country,
    message: parsed.data.message || null,
    user_id: user?.id ?? null,
  })

  if (error) {
    console.error('[submit-demo-request] Insert error:', error.message)
    return { error: 'errors.serverError' }
  }

  return { success: true as const }
}
```

**File:** `src/app/actions/platform-demo-requests.ts` — admin server actions:

Pattern follows `platform-leagues.ts`: `getPlatformAdminContext()` → UUID validate → Zod validate → query → `revalidatePath()`.

Actions needed (simplified from original plan — `admin_notes` and separate `approveDemoAccount` cut):
- `updateDemoRequestStatus(id, status)` — change status column. When status is `'converted'` AND linked `user_id` exists, also set `is_approved=true` on the profile (inlined approve shortcut). Must verify profile `role = 'scout'` before approving.

```typescript
'use server'
import { getPlatformAdminContext } from '@/lib/auth'
import { uuidSchema } from '@/lib/validations'
import { DEMO_STATUSES } from '@/lib/constants'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const statusSchema = z.enum(DEMO_STATUSES)

export async function updateDemoRequestStatus(requestId: string, newStatus: string) {
  if (!uuidSchema.safeParse(requestId).success) return { error: 'errors.invalidId' }
  const parsedStatus = statusSchema.safeParse(newStatus)
  if (!parsedStatus.success) return { error: 'errors.invalidInput' }

  const { error: authErr, admin } = await getPlatformAdminContext()
  if (authErr || !admin) return { error: authErr ?? 'errors.unauthorized' }

  // Atomic update with .select() to verify matched rows
  const { data: updated, error } = await admin
    .from('demo_requests')
    .update({ status: parsedStatus.data })
    .eq('id', requestId)
    .select('id, user_id, status')

  if (error) {
    console.error('[platform-demo-requests] Status update error:', error.message)
    return { error: 'errors.serverError' }
  }
  if (!updated?.length) return { error: 'demo.notFound' }

  // Auto-approve: when converting AND user is linked, approve their account
  // MUST use admin client — is_approved column excluded from column-level GRANT (migration 044)
  if (parsedStatus.data === 'converted' && updated[0].user_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', updated[0].user_id)
      .single()

    if (profile?.role === 'scout') {
      await admin
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', updated[0].user_id)
        .select('is_approved') // verify update succeeded
    }
  }

  revalidatePath('/platform/demo-requests')
  revalidatePath('/platform/scouts')
  return { success: true }
}
```

### Research Insights (Task 2)

**From Pattern Recognition Specialist:**
- Always validate UUID params with `uuidSchema.safeParse()` before querying (established in `platform-leagues.ts`)
- Create Zod schemas for ALL admin mutation inputs (status update uses `statusSchema = z.enum(DEMO_STATUSES)`)
- Add `import type { z } from 'zod'` for type aliases (build will fail without it)
- Two public form actions using different Supabase clients is correct but needs a comment explaining why

**From Security Sentinel:**
- Rate limit the public form: max 3 submissions per email per hour (matches existing `contact-message.ts` pattern)
- Honeypot must be validated server-side (server actions are directly callable via POST, client-only honeypot is bypassable)
- "Approve Account" must verify `role = 'scout'` before setting `is_approved=true` — Academy Directors need the separate invite flow

**From Simplicity Reviewer:**
- Inline `approveDemoAccount` into `updateDemoRequestStatus` when status=converted — one action, one code path
- Cut `updateDemoRequestNotes` entirely — solo developer doesn't need CRM notes in v1

**From Framework Docs Researcher:**
- Use `.maybeSingle()` not `.single()` for duplicate check (returns null instead of error when 0 rows)
- Normalize email to lowercase on INSERT — Supabase Auth stores emails lowercase, so backfill matching works correctly

**Verification:**
- [x] Zod schema validates all required fields
- [x] Public action uses service role client with comment explaining why
- [x] Honeypot check returns silent success (doesn't reveal detection)
- [x] Rate limiting: max 3 per email per hour
- [x] Email normalized to lowercase on INSERT
- [x] Duplicate detection uses `.maybeSingle()`
- [x] Admin actions validate UUID with `uuidSchema`
- [x] Admin actions validate status with `z.enum(DEMO_STATUSES)`
- [x] Auto-approve on `converted` checks `role = 'scout'`
- [x] `revalidatePath` on all admin mutations

---

#### Task 3: ~~API Route~~ → ELIMINATED (use `router.refresh()`)

**Decision (from Simplicity Reviewer):** The separate `/api/demo-requests/mine` API route is unnecessary. The pending page server component already fetches the demo request via admin client and passes it as `initialDemoRequest` prop. For status updates (which happen at most once a day when the admin manually changes them), `router.refresh()` inside the existing `checkApproval` polling loop is sufficient — it re-executes the server component, which re-fetches with admin client and passes the updated prop.

**Implementation:** In `PendingPolling.tsx`, add `router.refresh()` at the end of `checkApproval()` (unconditionally). The server component re-renders, re-fetches demo request status, and passes the new prop. Zero new files, zero new API surface.

**Why this works:** Demo request status changes at most once per day (admin manually updates). The 30s polling + tab-focus re-check is more than sufficient. Real-time updates for a status that changes once are unnecessary overhead.

---

### Phase B: Demo Request Pages

#### Task 4: `/demo` Page — Public Demo Request Form

**File:** `src/app/(shared)/demo/page.tsx` — server component wrapper

Checks if user is logged in and already has a demo request. Passes initial state to client form.

**File:** `src/components/demo/DemoRequestForm.tsx` — client component

Split layout:
- **Left panel (value prop):**
  - Headline: "See Georgian Talent Up Close" / "ქართული ტალანტი ახლოდან"
  - Benefits list (4 items): Platform walkthrough, League analytics, Direct messaging with academies, Custom pricing options
  - Pricing display-only section:
    - Club packages from EUR 1,990/year
    - Individual scout access from EUR 490/year
    - Georgian academies from EUR 350/month
  - Partner logo: Starlive/Pixellot mention

- **Right panel (form):**
  - Full name (text input, required)
  - Email (email input, required; auto-filled if logged in)
  - Organization / Club name (text input, required)
  - Role (dropdown: Scout, Club Sporting Director, Agent, Academy Director, Other)
  - Country (dropdown using `SCOUT_COUNTRIES` from constants)
  - Message (textarea, optional)
  - Honeypot field (hidden, `aria-hidden`, tabindex=-1)
  - "Request Demo" submit button with loading state
  - Success state: replaces form with "Thank you! We'll be in touch within 24 hours"

- **Logged-in + already submitted:** Show status card instead of form ("You already submitted a demo request. Status: [status text]")

**Key patterns:**
- Zod validation client-side before calling server action
- `submitDemoRequest()` server action
- All strings via `t()` with EN/KA translation keys
- Mobile: stack panels vertically (form on top)
- Error toast on server error

**New translation keys needed (~25):**
- `demo.pageTitle`, `demo.pageSubtitle`
- `demo.headline`, `demo.benefit1`-`demo.benefit4`
- `demo.pricingTitle`, `demo.pricingClub`, `demo.pricingScout`, `demo.pricingAcademy`, `demo.pricingNote`
- `demo.formName`, `demo.formEmail`, `demo.formOrganization`, `demo.formRole`, `demo.formCountry`, `demo.formMessage`, `demo.formMessagePlaceholder`
- `demo.submit`, `demo.submitting`
- `demo.successTitle`, `demo.successMessage`
- `demo.alreadySubmitted`, `demo.statusNew`, `demo.statusContacted`, `demo.statusDemoDone`, `demo.statusDeclined`

**Anti-spam implementation (3 layers, zero dependencies):**

1. **Honeypot field:**
   - Field name: `website` (plausible name bots would fill)
   - HTML: `<input type="text" name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" />`
   - Pass as separate param to server action: `submitDemoRequest(data, formData.get('website') as string)`
   - Server-side: if non-empty, return `{ success: true }` silently (don't reveal detection)

2. **Time-based detection** (from Best Practices Researcher):
   - Hidden field: `<input type="hidden" name="_t" value={mountTimeRef.current} />`
   - Server-side: reject submissions < 2 seconds after form render (bots submit instantly)
   - Return silent success to avoid tipping off bots

3. **Rate limiting** (in server action, see Task 2):
   - Max 3 submissions per email per hour (matches existing `contact-message.ts` pattern)

**Metadata export** (Pattern Recognition finding — match contact page pattern):
```typescript
export const metadata: Metadata = {
  title: 'Request Demo | Georgian Football Talent',
  description: 'Schedule a demo of the Georgian Football Talent Platform.',
}
```

### Research Insights (Task 4)

**From Simplicity Reviewer:**
- Consider single-column centered layout instead of split layout. By the time someone clicks "Request Demo" they've already been sold by the landing page. The pricing display is the main argument for keeping split layout — **decision point for Andria**: keep split layout with pricing, or simplify to centered form.
- If split layout is kept, the left panel adds ~14 extra translation keys (benefits, pricing, note)

**From Pattern Recognition:**
- Follow `/contact` page pattern: server component wrapper with `metadata` export, auth check to prefill email, renders client form component with prefilled data as props
- Component directory `demo/DemoRequestForm.tsx` follows existing `contact/ContactForm.tsx` convention

**Verification:**
- [x] Anonymous visitor can submit
- [x] Logged-in user sees auto-filled email
- [x] Duplicate blocked for logged-in users with existing request
- [x] Honeypot field rejects bot submissions (server-side check)
- [x] Rate limit works (max 3 per email per hour)
- [x] Form validates all required fields
- [x] Success state renders
- [x] `metadata` exported for SEO
- [x] Mobile responsive
- [x] All text bilingual

---

#### Task 5: `/platform/demo-requests` — Admin Management

**File:** `src/app/platform/demo-requests/page.tsx` — server component

Fetches all demo requests via `getPlatformAdminContext()` admin client. Default sort: `created_at desc`.

**File:** `src/components/platform/DemoRequestsTable.tsx` — client component

- Table columns: Name, Organization, Role, Country, Date, Status
- Click row → expand details panel (full message, admin notes, linked user info)
- Status dropdown: `new` → `contacted` → `demo_done` → `converted` / `declined`
  - No transition validation — admin can set any status (flexibility > constraints for a solo developer)
  - **When `converted` is selected:** auto-approves linked scout account (inlined into `updateDemoRequestStatus`). Shows "Account approved" toast. For non-scout roles, shows tooltip: "Academy admin roles need the Invite flow."
- ~~Admin notes: inline editable textarea~~ **CUT** (YAGNI — add later if needed)
- **Counts at top:** "X new · Y total"
- **Pagination:** Add `.range(0, 49)` to initial query — prevents unbounded table if demo requests grow
- **Filter:** Dropdown to filter by status (All, New, Contacted, Demo Done, Converted, Declined)

**Patterns:** Follow existing `/platform/clubs` and `/platform/leagues` table patterns.

**Verification:**
- [x] Lists all demo requests
- [x] Status change persists
- [x] Admin notes save on blur — CUT (YAGNI)
- [x] "Approve Account" auto-triggers when user_id + converted
- [x] Approval sets `is_approved=true` on linked profile
- [x] Filter by status works
- [x] Mobile: horizontal scroll on table

---

#### Task 6: PlatformSidebar — Add Demo Requests Link

**File:** `src/components/platform/PlatformSidebar.tsx`

Add between "Leagues" and "Players" links:

```typescript
{
  href: '/platform/demo-requests',
  labelKey: 'platform.nav.demoRequests',
  icon: '...', // clipboard-document-list icon
}
```

~~**Counter badge:**~~ **CUT** (Simplicity Reviewer: the admin table already shows "X new / Y total" counts. Adding a badge changes PlatformSidebar from zero-prop to prop-dependent, modifying two files for minimal benefit.)

**Implementation:** Simply add the link entry to the existing `links` array in `PlatformSidebar.tsx` — one object, same pattern as all other links. Zero changes to `platform/layout.tsx`.

**Verification:**
- [x] "Demo Requests" link appears in sidebar
- [x] Active state highlights correctly
- [x] Mobile tab bar includes the new link

---

### Phase C: Auth + Pending Page Integration

#### Task 7: Auth Callback Backfill

**File:** `src/app/(auth)/callback/route.ts`

After the existing `exchangeCodeForSession` + `getUser()` block, before the profile query, add:

```typescript
// Backfill: link demo request to newly confirmed user
// Uses PL/pgSQL function (JS .limit(1) on UPDATE is a PostgREST no-op)
if (user.email) {
  try {
    const adminClient = createAdminClient()
    await adminClient.rpc('backfill_demo_request', {
      p_user_id: user.id,
      p_email: user.email,
    })
  } catch (err) {
    // Log but don't block auth flow — user can submit from /pending
    console.error('[callback] Demo request backfill error:', err)
  }
}
```

### Research Insights (Task 7)

**CRITICAL — from Data Integrity Guardian + Pattern Recognition:**
- `.limit(1)` on Supabase UPDATE is a **no-op** in PostgREST — it only limits the response body, not the rows affected. All matching rows would be updated.
- The `backfill_demo_request()` PL/pgSQL function (created in Task 1 migration) uses a subquery with `LIMIT 1 FOR UPDATE SKIP LOCKED` — the only reliable way to limit UPDATE scope.

**From Framework Docs Researcher:**
- Guard `user.email` with `if` statement, not `?? ''` — prevents matching empty-string emails
- `.ilike()` without wildcards is fine for email matching, but since we normalize to lowercase on INSERT (Task 2), the PL/pgSQL function uses `lower(email) = lower(p_email)` for maximum safety

**From Architecture Strategist:**
- Import `createAdminClient` from `@/lib/supabase/admin` — the regular client cannot access `demo_requests` (REVOKE)
- Wrap in try/catch — backfill failure must NOT block the auth callback
- The existing profile query + redirect logic stays exactly as-is

**Verification:**
- [x] Backfill uses RPC function, not direct UPDATE with `.limit(1)`
- [x] Guarded by `if (user.email)` — no empty-string matching
- [x] Only links one request (most recent, via subquery LIMIT)
- [x] `FOR UPDATE SKIP LOCKED` prevents race conditions with concurrent callbacks
- [x] Auth flow works even if backfill fails (try/catch)
- [x] Does not affect existing users who have no demo request

---

#### Task 8: PendingPolling — Show Demo Request Status

**File:** `src/app/(auth)/pending/page.tsx` — server component changes

Add server-side fetch of user's demo request (via admin client) and pass as prop to `PendingPolling`:

```typescript
// Fetch demo request status for the user
const adminClient = createAdminClient()
const { data: demoRequest } = await adminClient
  .from('demo_requests')
  .select('id, status, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

return <PendingPolling userId={user.id} initialDemoRequest={demoRequest} />
```

**File:** `src/components/auth/PendingPolling.tsx` — client component changes

Three display states (update the existing two):
1. **No demo request:** Current behavior + "Request a demo to get started" CTA (already exists)
2. **Has demo request:** Show status card with user-facing text:
   - `new`: "Your demo request has been received. We'll contact you within 24 hours."
   - `contacted`: "We've reached out to schedule your demo. Check your email."
   - `demo_done`: "Your demo is complete. We're finalizing your access."
   - `declined`: "Your request could not be approved at this time. Contact info@gft.ge for assistance."
3. **Approved:** Redirect (existing behavior)

**Polling for demo request status (simplified — no API route):**
- Add `router.refresh()` at the end of `checkApproval()` — this re-executes the server component, which re-fetches the demo request via admin client and passes updated prop
- Compare new prop value with a ref to detect changes and update displayed status
- Same 30s interval, no additional fetch needed

### Research Insights (Task 8)

**From Frontend Races Reviewer:**
- `router.refresh()` is already called after approval redirect (line 74). Adding it unconditionally at the end of `checkApproval` means demo request status updates flow through the same mechanism.
- Use a `demoStatusRef` to compare prev vs current prop value — only update display when status actually changes (prevents unnecessary re-renders)
- The existing AbortController + canceledRef + isRedirectingRef guards all still apply

**From Simplicity Reviewer:**
- This approach eliminates an entire API route, an additional fetch call in checkApproval, and the complexity of parsing two different response formats in the same polling callback

**Verification:**
- [x] Shows "request a demo" when no linked request
- [x] Shows correct status text for each status value
- [x] Status updates via `router.refresh()` without dedicated API
- [x] Declined state shows contact email
- [x] Approval redirect still works
- [x] No new API surface to secure

---

### Phase D: Landing Page Redesign

#### Task 9: Update Landing Components

**Files to update:**

1. **`src/components/landing/LandingHero.tsx`**
   - Primary CTA: `/register` → `/demo`, text: "Request Demo" / "დემოს მოთხოვნა"
   - Secondary CTA: `/about` stays, text stays "Learn More"
   - Subtitle: update to portal model copy (remove "scouting platform" → "talent portal")
   - Mock player card: can stay as-is (it demonstrates platform capabilities)

2. **`src/components/landing/HowItWorks.tsx`**
   - Step 1: "Request Demo" / "Explore the platform with a personal walkthrough"
   - Step 2: "Explore Leagues" / "Browse Georgian youth leagues with Starlive camera coverage"
   - Step 3: "Connect" / "Message academies directly through the platform"
   - Subtitle: update from "sign-up to scouting" to "demo to access"

3. **`src/components/landing/AudiencePanels.tsx`**
   - Scout benefits: remove "Watchlist with private scouting notes", replace with "Access to league analytics and camera stats"
   - Scout CTA: `/register` → `/demo`, text: "Request Demo"
   - Academy benefits: keep mostly as-is (still valid)
   - Academy CTA: `/login` stays (academy admins are invited, not self-registered)

4. **`src/components/landing/CtaBanner.tsx`**
   - Title: "Ready to Discover Georgian Talent?" (softened from scouting)
   - CTA: `/register` → `/demo`, text: "Request Demo"

5. **`src/components/landing/LandingNav.tsx`** (verify Session 2 already updated this — if not, fix)
   - Auth CTA should point to appropriate destination

6. **`src/components/landing/LandingFooter.tsx`**
   - Remove `/register` links, replace with `/demo`
   - Remove "Browse Players", "Match Library", "Watchlist" links
   - Add "Leagues", "Request Demo"

7. **Other components with stale links:**
   - `src/components/about/AboutContent.tsx` — update any `/register` or `/players` links
   - `src/components/layout/Navbar.tsx` — verify Session 2 already updated (anonymous CTA)

**Remove all references to removed features from landing content:**
- AI search, advanced filters, player comparison, radar charts
- Watchlist, scouting reports, PDF export
- "Search, filter, and compare 37,600+ youth players"
- "Browse all registered Georgian youth players in one place"

**Verification:**
- [x] No `/register` links remain on landing page
- [x] No references to removed features (players, matches, watchlist, compare)
- [x] All CTAs point to `/demo` or `/leagues` as appropriate
- [x] Academy CTA still points to `/login` (invited users)
- [x] Mobile responsive
- [x] Both themes render correctly (light landing + dark for authenticated)

---

#### Task 10: Translation Updates

**Files:** `src/lib/translations/landing.ts`, `src/lib/translations/core.ts`, and `src/lib/translations/admin.ts`

**IMPORTANT (from Pattern Recognition):** `platform.*` keys go in `admin.ts`, NOT `core.ts`. All existing `platform.nav.*`, `platform.title`, `platform.subtitle` keys are in `admin.ts`. The `demo.*` form/page keys and `auth.pendingDemoStatus*` keys go in `core.ts` (where existing `demo.*` and `auth.*` namespaces live).

**Landing translations to UPDATE (EN + KA):**
- `heroTitle`: keep as-is (still accurate)
- `heroSubtitle`: update to portal model copy
- `step1Title`/`step1Desc` through `step3Title`/`step3Desc`: new 3-step portal flow
- `scoutBenefit1`-`scoutBenefit4`: remove watchlist, add league analytics
- `scoutCta`: "Start Scouting" → "Request Demo"
- `ctaTitle`: update
- `ctaCta`: "Start Scouting" → "Request Demo"
- `footerBrowsePlayers`, `footerMatchLibrary`, `footerShortlist`: replace with leagues/demo links
- `whatWeDoTitle` through `feature3Desc`: update to portal language (if still displayed)
- `service1Title`-`service5Title`: update or remove services section references

**New translation keys to ADD (EN + KA):**
- `demo.*` (~25 keys): form labels, pricing, benefits, status messages, success state
- `platform.nav.demoRequests`: sidebar label
- `platform.demoRequests.*` (~15 keys): table headers, status labels, approve button, empty state, counter badge
- `auth.pendingDemoStatus*`: status messages for pending page (~5 keys)

**Estimated total: ~45 new/updated translation keys, each in EN and KA.**

**Verification:**
- [x] No untranslated strings visible in either language
- [x] All new `demo.*` keys have both EN and KA
- [x] All updated landing keys reflect portal model
- [x] No leftover references to removed features in translations

---

## System-Wide Impact

### Interaction Graph

- `submitDemoRequest()` → INSERT into `demo_requests` via admin client → no triggers or side effects
- Auth callback → `exchangeCodeForSession()` → profile query → **NEW: demo_requests backfill UPDATE** → redirect
- `updateDemoRequestStatus()` → UPDATE `demo_requests.status` → `revalidatePath()` → pending page poll picks up change
- `approveDemoAccount()` → UPDATE `profiles.is_approved=true` → `revalidatePath()` → PendingPolling detects approval → redirect

### Error & Failure Propagation

- Demo form submit failure → error toast → user can retry
- Auth callback backfill failure → logged, auth flow continues normally → user lands on `/pending` without linked request → they can submit from `/pending`
- `router.refresh()` failure → PendingPolling retains last known state from prop → user can still submit from `/demo`
- Admin status change failure → error toast → admin can retry

### State Lifecycle Risks

- **Orphaned demo request:** Anonymous submission where user never registers. Harmless — admin sees it without `user_id`, can still contact via email.
- **Multiple anonymous submissions:** Same email, different names. Admin sees all, can deduplicate manually.
- **Backfill miss:** User registers with different email than demo request. Demo request stays unlinked. Admin can manually note this.

### API Surface Parity

- New `submitDemoRequest` server action — public, uses admin client, honeypot + rate limit
- New `updateDemoRequestStatus` server action — platform admin only, auto-approves on `converted`
- New `backfill_demo_request()` PL/pgSQL function — called via RPC from auth callback
- ~~`/api/demo-requests/mine`~~ — eliminated, replaced by `router.refresh()` in PendingPolling

---

## Acceptance Criteria

### Functional Requirements

- [x] Anonymous visitors can submit demo request form
- [x] Logged-in users see auto-filled email
- [x] Logged-in users with existing request see status instead of form
- [x] Platform admin can view all demo requests in a table
- [x] Platform admin can change request status
- [x] Platform admin can add/edit admin notes — CUT (YAGNI)
- [x] "Approve Account" shortcut works when user_id linked + status=converted
- [x] Auth callback backfills user_id on email confirmation
- [x] `/pending` page shows demo request status when one exists
- [x] Demo request status updates via polling on `/pending`
- [x] Landing page CTAs point to `/demo`
- [x] No references to removed features on landing page
- [x] PlatformSidebar shows "Demo Requests" link

### Non-Functional Requirements

- [x] All user-facing text bilingual (EN + KA)
- [x] `npm run build` clean — zero type errors
- [x] Mobile responsive on all new pages
- [x] Demo form includes honeypot anti-spam field
- [x] No direct client access to `demo_requests` (REVOKE enforced)

---

## Dependencies & Prerequisites

- **Session 1 complete:** Approval gate, `/pending` page, middleware restructuring
- **Session 2 complete:** Leagues system, navigation overhaul
- **Supabase local running:** For migration testing
- **Types regenerated:** After migration, before building components

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backfill fails silently | User's demo request not linked | Try/catch with logging; admin can identify unlinked requests by email |
| Spam on demo form | Table filled with junk data | Honeypot field + server-side validation; future: rate limiting |
| Wrong pricing displayed | Confusion with real customers | Prices are display-only, marked as "starting from" |
| Translation volume (~90 strings total) | Session overrun | Prioritize EN first, KA can be stubbed if needed |

---

## Files Changed (Summary)

### New Files
- `supabase/migrations/20250101000046_create_demo_requests.sql`
- `src/app/actions/submit-demo-request.ts`
- `src/app/actions/platform-demo-requests.ts`
- `src/app/(shared)/demo/page.tsx` (replaces existing stub)
- `src/components/demo/DemoRequestForm.tsx`
- `src/app/platform/demo-requests/page.tsx`
- `src/components/platform/DemoRequestsTable.tsx`

### Modified Files
- `src/lib/validations.ts` — add `demoRequestFormSchema`
- `src/lib/constants.ts` — add `DEMO_ROLES`, `DEMO_STATUSES`
- `src/lib/database.types.ts` — regenerated
- `src/lib/translations/core.ts` — new `demo.*` and `auth.pendingDemoStatus*` keys
- `src/lib/translations/admin.ts` — new `platform.nav.demoRequests` and `platform.demoRequests.*` keys
- `src/lib/translations/landing.ts` — updated landing copy
- `src/app/(auth)/callback/route.ts` — add backfill RPC call
- `src/app/(auth)/pending/page.tsx` — fetch + pass demo request to PendingPolling
- `src/components/auth/PendingPolling.tsx` — show demo request status + `router.refresh()`
- `src/components/platform/PlatformSidebar.tsx` — add demo-requests link (no badge, no props change)
- `src/components/landing/LandingHero.tsx` — CTAs + copy
- `src/components/landing/HowItWorks.tsx` — new steps
- `src/components/landing/AudiencePanels.tsx` — updated benefits + CTAs
- `src/components/landing/CtaBanner.tsx` — CTA + copy
- `src/components/landing/LandingFooter.tsx` — updated links

### Files NOT Changed (from simplification)
- ~~`src/app/api/demo-requests/mine/route.ts`~~ — eliminated (use `router.refresh()`)
- ~~`src/app/platform/layout.tsx`~~ — no badge count query needed
- ~~`supabase/seed.sql`~~ — no seed data (test via form submission)

### Prerequisite
- Upgrade Next.js to 16.1.7+ before deploying (CVE-2026-27978 CSRF fix)

---

## Sources & References

### Origin
- **Design spec:** [docs/superpowers/specs/2026-03-24-platform-pivot-design.md](docs/superpowers/specs/2026-03-24-platform-pivot-design.md) — Section 4 (New Pages: /demo), Section 7 (Platform Admin: demo-requests), Section 8 (Build Order: Session 3)

### Internal References
- Server action pattern: `src/app/actions/platform-leagues.ts`
- Admin client: `src/lib/supabase/admin.ts`
- Form pattern: `src/components/platform/ClubForm.tsx`, `src/components/platform/LeagueForm.tsx`
- Validation pattern: `src/lib/validations.ts:41` (leagueFormSchema)
- Auth callback: `src/app/(auth)/callback/route.ts`
- PendingPolling: `src/components/auth/PendingPolling.tsx`
- PlatformSidebar: `src/components/platform/PlatformSidebar.tsx`
- Translations: `src/lib/translations/landing.ts`, `src/lib/translations/core.ts`

### Prior Sessions
- Session 1 plan: `docs/plans/2026-03-24-refactor-platform-pivot-session-1-strip-routes-approval-gate-plan.md`
- Session 2 plan: `docs/plans/2026-03-24-feat-platform-pivot-session-2-leagues-navigation-plan.md`
