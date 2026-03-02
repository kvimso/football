---
title: "Phase A — P1 Critical Security & Auth Fixes (8 Items)"
date: 2026-03-02
category: security
tags:
  - filter-injection
  - rls-violation
  - authorization-bypass
  - type-safety
  - ownership-check
  - error-disclosure
  - idor
  - role-validation
severity: critical
component:
  - src/app/api/matches/route.ts
  - supabase/migrations (RLS + RPC)
  - src/lib/api-utils.ts
  - src/lib/transfer-helpers.ts
  - src/app/api/contact-requests/route.ts
  - src/app/actions/shortlist.ts
  - src/app/api/conversations/[conversationId]/block/route.ts
  - src/app/api/messages/[conversationId]/read/route.ts
status: resolved
---

# Phase A — P1 Critical Security & Auth Fixes

## Problem

Two independent code reviews (19-item todo set + 29-item full codebase audit) identified 8 P1 critical security vulnerabilities across the platform's API routes, RLS policies, RPC functions, and server actions.

### Symptoms

| ID | Vulnerability | Severity |
|----|--------------|----------|
| A1 | PostgREST filter injection — `club` param interpolated into `.or()` without validation | High |
| A2 | RLS over-permissive — academy_admin could write 5 camera-only tables | Critical |
| A3 | SECURITY DEFINER RPC with no `auth.uid()` check — any user could accept transfers | Critical |
| A4 | `authenticateRequest` nullable return forcing 30+ non-null assertions | Medium |
| A5 | Untyped `SupabaseClient` in transfer helpers — no compile-time safety | Medium |
| A6 | Contact requests PATCH missing ownership check (IDOR) | High |
| A7 | Shortlist server actions missing `role === 'scout'` check | Medium |
| A8 | Raw Supabase error messages leaked to client (3 routes) | Low |

## Root Cause

Four categories of issues:

1. **Input Validation:** User-supplied query parameters passed directly to Supabase filter builders without sanitization (A1)
2. **Authorization:** RLS policies too permissive, RPC functions missing internal auth, API endpoints not verifying resource ownership (A2, A3, A6, A7)
3. **Type Safety:** Nullable auth helper return type propagating `!` assertions everywhere; untyped Supabase client losing compile-time checks (A4, A5)
4. **Information Disclosure:** Raw database error messages returned directly to clients (A8)

## Solutions

### A1 — PostgREST Filter Injection

**File:** `src/app/api/matches/route.ts`

Added UUID validation before constructing the `.or()` filter:

```typescript
import { uuidSchema } from '@/lib/validations'

if (club) {
  if (!uuidSchema.safeParse(club).success) {
    return apiError('errors.invalidInput', 400)
  }
  query = query.or(`home_club_id.eq.${club},away_club_id.eq.${club}`)
}
```

### A2 — RLS Camera-Only Table Policies

**File:** `supabase/migrations/20260302000001_drop_academy_admin_camera_table_policies.sql`

Dropped all academy_admin write policies on 5 camera-only tables (`player_skills`, `player_season_stats`, `matches`, `match_player_stats`, `player_videos`). Re-created as `platform_admin`-only. Camera data is written exclusively by the service role.

### A3 — Transfer RPC Authorization

**File:** `supabase/migrations/20260302000002_transfer_rpc_authorization.sql`

Added authorization check inside `accept_transfer_request` SECURITY DEFINER function:

```sql
IF NOT EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid()
    AND (
      (role = 'academy_admin' AND club_id = v_request.from_club_id)
      OR role = 'platform_admin'
    )
) THEN
  RETURN jsonb_build_object('error', 'errors.unauthorized');
END IF;
```

### A4 — authenticateRequest Discriminated Union

**Files:** `src/lib/api-utils.ts` + 11 API route files

Refactored from nullable return to discriminated union:

```typescript
export type AuthResult =
  | { ok: true; user: User; profile: AuthProfile }
  | { ok: false; error: NextResponse }

// Consumer pattern — zero non-null assertions:
const auth = await authenticateRequest(supabase)
if (!auth.ok) return auth.error
const { user, profile } = auth  // both guaranteed non-null
```

### A5 — SupabaseClient Database Generic

**File:** `src/lib/transfer-helpers.ts`

Changed all functions from `SupabaseClient` to `SupabaseClient<Database>`. For the one `.rpc()` call not in generated types, used `(client as SupabaseClient)` cast.

### A6 — Contact Requests IDOR

**File:** `src/app/api/contact-requests/route.ts`

Added ownership check before allowing PATCH — fetches request with player join, verifies `player.club_id === profile.club_id`:

```typescript
const { data: existingRequest } = await supabase
  .from('contact_requests')
  .select('id, player:players!contact_requests_player_id_fkey(club_id)')
  .eq('id', requestId)
  .single()

if (!existingRequest) return apiError('errors.requestNotFound', 404)
if (playerClubId !== profile.club_id) return apiError('errors.unauthorized', 403)
```

### A7 — Shortlist Role Check

**File:** `src/app/actions/shortlist.ts`

Added profile fetch + role check to all 3 server actions (`addToShortlist`, `removeFromShortlist`, `updateShortlistNote`):

```typescript
const { data: profile } = await supabase
  .from('profiles').select('role').eq('id', user.id).single()
if (profile?.role !== 'scout') return { error: 'errors.unauthorized' }
```

### A8 — Raw Error Leak

**Files:** `block/route.ts` (2 locations), `read/route.ts` (1 location)

Replaced `error.message` in client responses with `'errors.serverError'`, preserved `console.error` for server-side debugging.

## Prevention Strategies

### Input Validation

- **Never interpolate user input into PostgREST filter strings.** Always validate with `uuidSchema.safeParse()` or similar before use.
- **Checklist:** Any `.or()`, `.filter()`, or string-interpolated filter must use pre-validated input.

### Authorization

- **Every mutation endpoint must verify role + ownership before executing.** RLS is defense-in-depth, not the only layer.
- **SECURITY DEFINER functions must include internal `auth.uid()` checks** replicating the authorization logic they bypass.
- **RLS Principle of Least Privilege:** Default to read-only, add write access only to tables/roles that truly need it.
- **Checklist:** For each role, list the tables they need to write. Any extra write policies are over-permissive.

### Type Safety

- **Use discriminated unions for auth helpers.** Never return nullable types that force `!` assertions across the codebase.
- **Always use `SupabaseClient<Database>`** for compile-time safety on `.from()` calls.
- **Checklist:** Zero `!` assertions on auth results. `npm run build` passes clean.

### Information Disclosure

- **Never return `error.message` from Supabase to the client.** Log it server-side, return a generic key.
- **Checklist:** Search for `error.message` in API response bodies — should only appear in `console.error`.

## Verification

- `npm run build` passes with zero errors
- Zero non-null assertions on auth results across all API routes
- All Phase A plan checkboxes marked complete
- Todo files renamed from `pending` to `complete`

## Related Documents

- [Consolidated Remediation Plan](../../plans/2026-03-02-refactor-consolidated-review-remediation-plan.md) — Phase A section
- [Previous Security Audit Fixes](comprehensive-audit-security-code-quality-fixes.md) — Phase A security headers, XSS, TOCTOU
- [Chat System Code Review Fixes](chat-system-code-review-fixes.md) — Phase 6.5 security hardening
- CLAUDE.md — Permission Model section (lines 201-295)
