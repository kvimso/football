---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Refactor authenticateRequest to Discriminated Union

## Problem Statement

`authenticateRequest()` returns `{ user: User | null, profile: ... | null, error: NextResponse | null }`. After the error guard (`if (authResponse) return authResponse`), TypeScript cannot narrow `user` and `profile` to non-null. This forces 30+ non-null assertions (`profile!.role`, `user!.id`, `profile!.club_id!`) across all 10 API routes.

**Why it matters:** Non-null assertions bypass TypeScript's type safety. If the auth helper is ever refactored incorrectly, all those `!` assertions will silently pass, potentially causing runtime errors or security issues.

## Findings

**Source:** TypeScript Reviewer (Critical #2) + Architecture Strategist (Risk #2)

**Locations (30+ occurrences):**
- `src/app/api/shortlist/route.ts` (lines 34, 81, 107)
- `src/app/api/contact-requests/route.ts` (lines 26, 34, 47, 77, 114, 135, 159)
- `src/app/api/transfers/route.ts` (lines 25, 44, 48, 82, 94, 109, 116, 127)
- `src/app/api/transfers/[id]/route.ts` (lines 25, 45)
- `src/app/api/admin/players/route.ts` (lines 21, 25, 26, 50, 54, 55)
- All other API routes

## Proposed Solutions

### Option A: Discriminated Union Return Type (Recommended)

```typescript
type AuthProfile = { role: string; club_id: string | null; full_name: string | null }

type AuthResult =
  | { ok: true; user: User; profile: AuthProfile }
  | { ok: false; error: NextResponse }

export async function authenticateRequest(
  supabase: SupabaseClient<Database>
): Promise<AuthResult> { ... }
```

Callers become:
```typescript
const auth = await authenticateRequest(supabase)
if (!auth.ok) return auth.error
// auth.user and auth.profile are now narrowed — no ! needed
```

- **Pros:** Eliminates all 30+ non-null assertions, type-safe narrowing
- **Cons:** All 10 API routes need minor refactor
- **Effort:** Medium (touch 11 files, but mechanical change)
- **Risk:** Low (type-only refactor, same runtime behavior)

## Recommended Action

Option A. Single highest-impact TypeScript improvement in this diff.

## Technical Details

- **Affected files:** `src/lib/api-utils.ts` + all 10 API route files
- **Components:** API authentication layer

## Acceptance Criteria

- [ ] `authenticateRequest` returns discriminated union with `ok: true/false`
- [ ] Zero non-null assertions (`!`) on auth result in any API route
- [ ] All API routes compile without errors
- [ ] `npm run build` passes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - TypeScript Reviewer + Architecture Strategist |
