---
title: Full Codebase Review Fixes
type: refactor
status: active
date: 2026-03-02
---

# Full Codebase Review Fixes

## Overview

Comprehensive fix plan synthesized from 8 parallel review agents analyzing the entire 186-file Georgian Football Platform codebase. Findings are deduplicated, prioritized, and organized into executable phases.

**Review Agents Used:** TypeScript Reviewer, Security Sentinel, Performance Oracle, Architecture Strategist, Pattern Recognition Specialist, Data Integrity Guardian, Code Simplicity Reviewer, Agent-Native Reviewer.

**Total Unique Findings:** 52 (after deduplication)
- **P1 Critical:** 8 (blocks production readiness)
- **P2 Important:** 18 (should fix before launch)
- **P3 Nice-to-have:** 16 (improvements)
- **P4 Future:** 10 (agent-native API, post-launch)

---

## Phase A: Security Fixes (P1 — Do First)

These are the highest-risk findings that could lead to data exposure or exploitation.

### A1. PostgREST Filter Injection in Player Search API

**Severity:** CRITICAL | **Agents:** Security, Data Integrity
**File:** `src/app/api/players/search/route.ts:22-30`

The search API embeds user input directly into `.or()` filter without escaping. An attacker can inject PostgREST operators via crafted query strings. Other search locations (`admin-transfers.ts:58`, `players/page.tsx:119`) correctly use `escapePostgrestValue()`.

```typescript
// BEFORE (line 22):
const pattern = `%${query}%`

// AFTER:
import { escapePostgrestValue } from '@/lib/utils'
const sanitized = escapePostgrestValue(query)
if (!sanitized) return NextResponse.json({ players: [] })
const pattern = `%${sanitized}%`
```

### A2. Sensitive Column `parent_guardian_contact` Exposed via RLS

**Severity:** HIGH | **Agents:** Security, Architecture
**File:** `supabase/migrations/20250101000002_create_players.sql:30-35`

The `players` table has `SELECT true` RLS policy. Any authenticated user can query `parent_guardian_contact` directly via the Supabase client (anon key is public). The app avoids selecting it, but RLS doesn't restrict it.

**Fix:** Create a migration that:
1. Creates a `players_public` view excluding `parent_guardian_contact`
2. Revokes direct SELECT on the `players` table from `authenticated`
3. Grants SELECT on the view to `authenticated`
4. Update all Supabase queries to use the view (or keep using the table with service role for admin)

### A3. RLS Policies Allow Academy Admins to Write Camera-Only Tables

**Severity:** MEDIUM | **Agents:** Security
**File:** `supabase/migrations/20250101000012_create_rls_policies.sql:78-151`

CLAUDE.md states academy admins CANNOT write to stats/skills/videos tables, but RLS INSERT/UPDATE/DELETE policies permit it. An admin could issue direct Supabase calls.

**Fix:** New migration removing `academy_admin` from write policies on:
- `player_skills` (lines 78-112)
- `player_season_stats` (lines 117-151)
- `match_player_stats` (lines 199-245)
- `player_videos` (lines 354-388)

### A4. Contact Message Form Lacks Rate Limiting

**Severity:** HIGH | **Agents:** Security
**File:** `src/app/actions/contact-message.ts:6-25`

Public contact form allows unrestricted inserts with no auth and no rate limiting. Automated spam could flood the database.

**Fix:** Add IP-based rate limiting or CAPTCHA (Cloudflare Turnstile recommended).

### A5. Internal Error Messages Leaked to Client

**Severity:** MEDIUM | **Agents:** Security, TypeScript
**Files:** `src/app/api/messages/route.ts:84-87`, `src/app/api/chat-upload/route.ts:87`, multiple server actions

Raw `error.message` from Supabase is returned to clients, leaking schema details.

**Fix:** Replace all `{ error: error.message }` with `{ error: 'errors.serverError' }` and `console.error` the real message server-side. Applies to ~8 locations.

### A6. Add Security Headers

**Severity:** LOW | **Agents:** Security
**File:** `next.config.ts`

No CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers configured.

**Fix:** Add headers config in `next.config.ts`.

### A7. Reduce Signed URL Expiry

**Severity:** LOW | **Agents:** Security, Architecture
**File:** `src/lib/constants.ts:68`

7-day signed URL expiry is excessive. Leaked URLs remain accessible for a week.

**Fix:** Change `SIGNED_URL_EXPIRY_SECONDS` from `604800` to `3600` (1 hour). URLs are already regenerated on each message load.

### A8. Restrict `page_views` INSERT to Authenticated Users

**Severity:** LOW | **Agents:** Security
**File:** `supabase/migrations/20250101000021_analytics.sql:16-18`

`page_views` allows completely unauthenticated inserts. Should be `to authenticated`.

---

## Phase B: TypeScript & Runtime Safety (P1-P2)

### B1. Unsafe Role Cast in Conversations API

**Severity:** CRITICAL | **Agents:** TypeScript
**File:** `src/app/api/conversations/route.ts:129`

`profile.role as 'scout' | 'academy_admin'` is an unsafe cast. If a `platform_admin` hits this endpoint, the cast silently lies to the type system.

**Fix:** Add a runtime check:
```typescript
if (profile.role !== 'scout' && profile.role !== 'academy_admin') {
  return NextResponse.json({ error: 'errors.unauthorized' }, { status: 403 })
}
```

### B2. Unvalidated Realtime UPDATE Payloads

**Severity:** HIGH | **Agents:** TypeScript
**File:** `src/components/chat/ChatThread.tsx:254`

INSERT payloads are validated with `realtimeMessageSchema`, but UPDATE payloads (`read_at` changes) are not — raw data is spread into state.

**Fix:** Validate UPDATE payloads through the same Zod schema or a targeted subset.

### B3. ChatInbox Subscribes to ALL Messages Globally

**Severity:** CRITICAL | **Agents:** TypeScript, Performance, Architecture
**File:** `src/components/chat/ChatInbox.tsx:56-62`

The inbox subscribes to all INSERT events on the `messages` table without filtering. Every message sent by any user on the platform triggers a callback.

**Fix:** Filter subscription to only the user's conversation IDs:
```typescript
filter: `conversation_id=in.(${conversationIds.join(',')})`
```

### B4. Navbar Realtime Subscription Has No User Filter

**Severity:** HIGH | **Agents:** Architecture, Performance
**File:** `src/components/layout/Navbar.tsx:79`

Same issue as B3 — subscribes to ALL message inserts. At 100 concurrent users, every message triggers 100 RPC calls.

**Fix:** Same approach — filter by user's conversation IDs, or switch to polling with 30s interval.

### B5. `useLayoutEffect` SSR Warning in useDebounce

**Severity:** MEDIUM | **Agents:** TypeScript, Performance
**File:** `src/hooks/useDebounce.ts:10`

`useLayoutEffect` produces a warning during SSR in Next.js.

**Fix:** Replace with `useEffect` (debounce doesn't need synchronous layout measurement) or use `typeof window !== 'undefined'` guard.

### B6. Missing Discriminant Checks on Action Results

**Severity:** MEDIUM | **Agents:** TypeScript
**Files:** Multiple components checking `result.success` without narrowing

Components check `result.error` or `result.success` without using discriminated union narrowing. Risk of accessing wrong properties.

**Fix:** Add proper discriminant checks: `if ('error' in result) { ... } else { ... }`

### B7. Stale Closure in ChatThread `loadOlder` Callback

**Severity:** MEDIUM | **Agents:** TypeScript
**File:** `src/components/chat/ChatThread.tsx`

`loadOlder` captures stale `messages` array in closure. Could cause duplicate message loads.

**Fix:** Use functional state update or `useRef` for the messages array.

### B8. Double `router.push` Bug in FilterPanel

**Severity:** MEDIUM | **Agents:** TypeScript
**File:** `src/components/forms/FilterPanel.tsx:411`

Clearing filters fires two `router.push` calls in quick succession.

**Fix:** Consolidate into a single `router.push` call.

---

## Phase C: Performance (P1-P2)

### C1. `get_player_view_counts()` Full Table Scan

**Severity:** CRITICAL | **Agents:** Performance
**File:** `src/app/(platform)/players/page.tsx` — RPC call on every page load

The RPC function scans the entire `player_views` table to count views. No materialized view or cache.

**Fix:** Create a PostgreSQL function with indexed aggregation, or materialize view counts into a `player_view_summary` table updated by trigger.

### C2. Client-Side Pagination Fallback Fetches 500 Rows

**Severity:** CRITICAL | **Agents:** Performance, Architecture
**File:** `src/app/(platform)/players/page.tsx:153-213`

When age/stat filters are active, fetches up to 500 rows and filters client-side because age calculation happens in JavaScript.

**Fix:** Create a `player_age(dob date)` PostgreSQL function:
```sql
CREATE FUNCTION player_age(dob date) RETURNS integer
AS $$ SELECT date_part('year', age(dob))::integer $$
LANGUAGE SQL IMMUTABLE;
```
Then filter server-side in the query.

### C3. Player Profile Makes 12-15 Supabase Queries

**Severity:** HIGH | **Agents:** Performance
**File:** `src/app/(platform)/players/[slug]/page.tsx`

Each profile load fires 12-15 separate queries. Several could be combined or parallelized.

**Fix:** Consolidate into fewer queries using JOINs, or use `Promise.all` for independent queries (some may already be parallelized — verify).

### C4. 75KB Translations File Loaded in Every Client Component

**Severity:** MEDIUM | **Agents:** Performance, Architecture
**File:** `src/lib/translations.ts` — 1,391 lines

Every `useLang()` hook imports the entire 75KB translations object.

**Fix:** Split into domain-specific files (`translations/chat.ts`, `translations/admin.ts`, etc.) and lazy-load based on route.

### C5. CompareView Passes Entire Player List to Client

**Severity:** MEDIUM | **Agents:** Performance
**File:** `src/app/(platform)/players/compare/page.tsx`

All players are passed as props for the comparison dropdown.

**Fix:** Use the existing `/api/players/search` endpoint for async dropdown search instead.

### C6. Sequential Signed URL Generation in Chat Messages

**Severity:** MEDIUM | **Agents:** Performance
**File:** `src/lib/chat-queries.ts:164-174`

`Promise.all` with individual `createSignedUrl` calls. Each is a separate HTTP request.

**Fix:** Batch sign URLs or at minimum ensure these are truly parallel (they already use `Promise.all` — verify no waterfall).

---

## Phase D: Dead Code & Simplification (P2)

### D1. Delete Dead Contact Request UI System (~410 LOC)

**Severity:** HIGH | **Agents:** Simplicity
**Files to DELETE:**
- `src/components/forms/ContactRequestForm.tsx` (79 lines — never imported)
- `src/components/admin/RequestActions.tsx` (91 lines — never imported)
- `src/app/actions/contact.ts` (85 lines — only imported by dead components)
- `src/app/actions/admin-requests.ts` (117 lines — only imported by dead components)

**Also clean up:**
- Remove `contactRequestReceivedEmail` and `contactRequestStatusEmail` from `src/lib/email-templates.ts` (~38 lines)
- Remove `responseMessageSchema` from `src/lib/validations.ts` (1 line)

CLAUDE.md says "Remove old contact request UI" is checked complete, but these files persist.

### D2. Remove Unused Types and Constants

**Agents:** Simplicity, TypeScript, Pattern

| Item | Location | Lines |
|------|----------|-------|
| `ActionResult<T>` type | `src/lib/types.ts:9-11` | 3 |
| `ConversationClub`, `ConversationParty`, `ConversationLastMessage` | `src/lib/types.ts:61-80` | 20 |
| `FetchConversationsResult` interface | `src/lib/chat-queries.ts:4-7` | 4 |
| `AGE_MIN_DEFAULT`, `AGE_MAX_DEFAULT` | `src/lib/constants.ts:43-44` | 2 |

### D3. Remove Unused Signed URL from Chat Upload

**Agents:** Simplicity
**File:** `src/app/api/chat-upload/route.ts:90-98`

Generates a signed URL on upload that's never consumed by the client. Remove the `createSignedUrl` call and `file_url` from response.

---

## Phase E: Code Deduplication & Consistency (P2-P3)

### E1. Deduplicate Transfer Accept/Decline Logic

**Agents:** Pattern, Architecture
**Files:** `src/app/actions/admin-transfers.ts`, `src/app/actions/platform-transfers.ts`

The accept and decline logic is near-identical between admin and platform versions. Only the auth check differs.

**Fix:** Extract shared `executeTransferAccept(client, request)` and `executeTransferDecline(client, requestId)` helpers.

### E2. Deduplicate Club History Operations

**Agents:** Pattern
**Files:** 5 action files, 10+ instances

Extract `recordClubJoin(client, playerId, clubId)` and `recordClubDeparture(client, playerId, clubId)` helpers.

### E3. Deduplicate Chat Message Enrichment

**Agents:** Pattern, Simplicity
**Files:** `src/lib/chat-queries.ts:164-174`, `src/app/api/messages/route.ts:169-179`

Identical signed-URL enrichment pattern in two files.

**Fix:** Extract `enrichFileUrls()` helper in `chat-queries.ts` and import in API route.

### E4. Standardize UUID Validation

**Agents:** Pattern, TypeScript, Security
**Files:** `player-views.ts:8`, `chat-upload/route.ts:25`, `pdf/route.ts:14`

Three files use inline regex; rest use `uuidSchema` from validations.ts.

**Fix:** Replace inline regex with `uuidSchema.safeParse()` everywhere.

### E5. Standardize Error Strings to Translation Keys

**Agents:** Pattern, Security
**Files:** `src/lib/auth.ts` (7 strings), `src/app/api/players/[id]/pdf/route.ts` (3 strings), `src/app/api/chat-upload/route.ts` (1 string)

Some files use hardcoded English errors instead of `errors.*` translation keys.

**Fix:** Replace all with translation keys matching existing patterns.

### E6. Consolidate Error Boundary Pages

**Agents:** Pattern
**Files:** 5 near-identical `error.tsx` files

Extract a shared `ErrorBoundaryContent` component parameterized by `backHref` and `backLabel`.

### E7. Unify Input CSS Classes

**Agents:** Pattern
**Files:** `PlayerForm.tsx`, `PlatformPlayerForm.tsx`

These use long inline Tailwind classes while other forms use the `input` CSS class from globals.css.

**Fix:** Migrate to use the `input` class.

### E8. Extract FilterPanel Tag Component

**Agents:** Simplicity
**File:** `src/components/forms/FilterPanel.tsx:387-485`

10 near-identical JSX blocks for active filter tags.

**Fix:** Extract `FilterTag` component, reduce ~80 lines to ~30.

### E9. Use `getPlatformAdminContext()` in admin-invite.ts

**Agents:** Pattern
**File:** `src/app/actions/admin-invite.ts:10-22`

Manually recreates platform admin auth in 12 lines instead of using the 3-line helper.

---

## Phase F: Architecture Improvements (P2-P3)

### F1. Wrap `acceptTransfer` in Database Transaction

**Agents:** Architecture, Data Integrity
**File:** `src/app/actions/admin-transfers.ts:205-285`

6 sequential DB operations with no atomicity. Partial failure leaves inconsistent state.

**Fix:** Create a PL/pgSQL function that handles the entire accept flow atomically, called via `.rpc()`.

### F2. Add CHECK Constraint for Self-Transfers

**Agents:** Architecture
**File:** `supabase/migrations/` (new)

No constraint preventing `from_club_id = to_club_id`.

**Fix:** `ALTER TABLE transfer_requests ADD CHECK (from_club_id != to_club_id);`

### F3. Cache Auth Role in onAuthStateChange

**Agents:** Architecture
**File:** `src/context/AuthContext.tsx:44`

Currently re-fetches role on every auth event (including token refreshes). Only needed when user ID changes.

### F4. Split Admin Dashboard Into Sub-Components

**Agents:** Pattern, Architecture
**File:** `src/app/admin/page.tsx` (335 lines, 7 parallel queries)

Extract stat cards, scout activity, and player view breakdown into separate server components.

---

## Phase G: Agent-Native API (P4 — Post-Launch)

The platform has 7 of ~37 capabilities accessible via API (all in chat domain). Core scouting operations have zero API coverage.

### Priority API Routes to Create:

| Priority | Route | Purpose |
|----------|-------|---------|
| 1 | `GET /api/players` | Player directory with full filter support |
| 2 | `GET /api/players/[slug]` | Full player profile with stats |
| 3 | `GET/POST/DELETE/PATCH /api/shortlist` | Shortlist CRUD |
| 4 | `GET /api/clubs`, `GET /api/clubs/[slug]` | Club listing + detail |
| 5 | `GET /api/matches`, `GET /api/matches/[slug]` | Match listing + detail |
| 6 | Bearer token auth support | Modify server client to accept Authorization header |
| 7 | `POST/PATCH /api/contact-requests` | Contact request send/respond |
| 8 | `POST/PATCH /api/transfers/*` | Transfer operations |
| 9 | `POST/PUT /api/admin/players` | Admin player management |
| 10 | OpenAPI specification | Document all endpoints |

This phase is deferred until after launch — the platform works correctly for browser-based users.

---

## Acceptance Criteria

### Phase A (Security)
- [x] No PostgREST filter injection possible on any search endpoint
- [x] `parent_guardian_contact` not accessible via direct Supabase queries
- [x] Camera-only tables not writable by academy admins via RLS (already fixed in migration 016)
- [x] Contact form has rate limiting or CAPTCHA
- [x] No internal error messages leaked to client responses
- [x] Security headers configured in `next.config.ts`

### Phase B (TypeScript)
- [ ] All Realtime subscriptions filtered to user's conversations
- [ ] No unsafe type casts (role cast, unvalidated payloads)
- [ ] No SSR warnings from `useLayoutEffect`
- [ ] All action result checks use proper narrowing

### Phase C (Performance)
- [ ] Player view counts use indexed/materialized aggregation
- [ ] Age filtering happens at database level, not client-side
- [ ] Player profile loads in fewer than 5 queries
- [ ] Translations file is split by domain

### Phase D (Dead Code)
- [ ] All dead contact request UI files deleted
- [ ] All unused types/constants removed
- [ ] `npm run build` passes with zero warnings

### Phase E (Deduplication)
- [ ] Transfer logic shared between admin and platform
- [ ] Club history operations extracted to helpers
- [ ] UUID validation uses single approach everywhere
- [ ] Error strings use translation keys everywhere

### Phase F (Architecture)
- [ ] Transfer accept is atomic (database transaction)
- [ ] Self-transfer CHECK constraint in place
- [ ] Admin dashboard split into manageable sub-components

---

## Execution Order

```
Phase A (Security)     → Do first, ~2 sessions
Phase B (TypeScript)   → Second, ~1-2 sessions
Phase D (Dead Code)    → Quick wins, ~30 min
Phase C (Performance)  → Third, ~2 sessions
Phase E (Consistency)  → Fourth, ~1-2 sessions
Phase F (Architecture) → Fifth, ~1 session
Phase G (Agent API)    → Post-launch, ongoing
```

**Total estimated effort:** 8-10 focused sessions

---

## Sources & References

### Review Agents
- TypeScript Reviewer: 24 findings (2 critical, 6 high, 7 medium, 7 low)
- Security Sentinel: 1 critical, 2 high, 5 medium, 4 low
- Performance Oracle: 4 critical + 8 optimizations
- Architecture Strategist: 15 findings across 6 categories
- Pattern Recognition: 14 findings across naming, duplication, consistency
- Code Simplicity: ~446 LOC removable, 5 simplification recommendations
- Agent-Native Reviewer: 7/37 capabilities agent-accessible
- Data Integrity Guardian: partial results (rate limited)

### Prior Review Plan
- `docs/plans/2026-02-27-refactor-comprehensive-code-review-fixes-plan.md` — previous review, many items already fixed

### Key Files Referenced
- `src/app/api/players/search/route.ts` — A1 (filter injection)
- `src/components/chat/ChatInbox.tsx` — B3 (global subscription)
- `src/components/layout/Navbar.tsx` — B4 (global subscription)
- `src/app/(platform)/players/page.tsx` — C1, C2 (performance)
- `src/app/actions/admin-transfers.ts` — E1, F1 (dedup, atomicity)
- `src/lib/auth.ts` — E5 (error strings)
