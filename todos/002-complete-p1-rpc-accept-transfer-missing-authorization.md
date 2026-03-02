---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, security, authorization, database]
dependencies: []
---

# accept_transfer_request RPC Missing Authorization Check

## Problem Statement

The `accept_transfer_request` PL/pgSQL function is `SECURITY DEFINER` (bypasses RLS) but performs no authorization check on the caller. Any authenticated user who knows a transfer request UUID can call this function directly via PostgREST and accept any pending transfer.

**Why it matters:** A scout or admin from a different club could accept transfers they have no authority over, causing unauthorized player movements between clubs.

## Findings

**Source:** Security Sentinel (H2) + Data Integrity Guardian (Finding 1)

**Location:** `supabase/migrations/20250101000035_atomic_transfer_and_self_check.sql`, lines 11-74

The application code in `admin-transfers.ts` and `api/transfers/[id]/route.ts` checks authorization before calling the RPC. However, the RPC itself is directly callable by any authenticated user through the Supabase client:

```javascript
// Any authenticated user can do this from browser console
supabase.rpc('accept_transfer_request', { p_request_id: '<any-pending-request-id>' })
```

## Proposed Solutions

### Option A: Authorization Inside Function (Recommended)
Add `auth.uid()` check inside the PL/pgSQL function body.

```sql
-- After fetching v_request, before any mutations:
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

- **Pros:** Defense-in-depth, function is self-protecting regardless of caller
- **Cons:** None
- **Effort:** Small (new migration, ~15 lines)
- **Risk:** Very low

### Option B: Revoke Direct Execute Permission
Revoke EXECUTE from authenticated role, only allow service_role.

- **Pros:** Prevents any direct RPC call
- **Cons:** Breaks the API route which calls it with user's Supabase client
- **Effort:** Small
- **Risk:** Would require API route changes

## Recommended Action

Option A. Add authorization inside the function via a new migration.

## Technical Details

- **Affected files:** New migration file
- **Database changes:** `CREATE OR REPLACE FUNCTION accept_transfer_request` with auth check

## Acceptance Criteria

- [ ] Function rejects calls from users who are not from_club admins or platform_admins
- [ ] Direct RPC call from unauthorized user returns `{ error: 'errors.unauthorized' }`
- [ ] Existing transfer accept flow (admin UI + API route) still works
- [ ] No regression in transfer acceptance for authorized users

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Security Sentinel H2 + Data Integrity Guardian |

## Resources

- OWASP A01:2021 - Broken Access Control
- Prior pattern: `docs/solutions/security-issues/chat-system-code-review-fixes.md`
