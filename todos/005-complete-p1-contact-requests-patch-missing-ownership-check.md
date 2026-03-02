---
status: pending
priority: p1
issue_id: "005"
tags: [code-review, security, authorization]
dependencies: []
---

# Contact Requests PATCH Missing Club Ownership Verification

## Problem Statement

The PATCH handler for `/api/contact-requests` verifies the caller is an `academy_admin` but does not verify that the contact request belongs to a player at the admin's club. An admin from Club A could approve/reject contact requests for players at Club B.

**Why it matters:** IDOR vulnerability — academy admins could manipulate contact requests for players outside their club. RLS provides defense-in-depth but the API should not rely solely on it.

## Findings

**Source:** Security Sentinel (M2)

**Location:** `src/app/api/contact-requests/route.ts`, lines 130-168

```typescript
// Checks role but NOT club ownership
if (profile!.role !== 'academy_admin' && profile!.role !== 'platform_admin') {
  return apiError('errors.unauthorized', 403)
}
// Directly updates without verifying the request belongs to this admin's club
const { error: updateError } = await supabase
  .from('contact_requests')
  .update({ status: parsed.data.status, ... })
  .eq('id', requestId)
```

## Proposed Solutions

### Option A: Add Ownership Check (Recommended)

```typescript
// Fetch request and verify it belongs to admin's club
const { data: existingRequest } = await supabase
  .from('contact_requests')
  .select('id, player:players!contact_requests_player_id_fkey(club_id)')
  .eq('id', requestId)
  .single()

if (!existingRequest) return apiError('errors.requestNotFound', 404)
const playerClubId = unwrapRelation(existingRequest.player)?.club_id
if (profile!.role !== 'platform_admin' && playerClubId !== profile!.club_id) {
  return apiError('errors.unauthorized', 403)
}
```

- **Effort:** Small (~10 lines)
- **Risk:** None

## Technical Details

- **Affected files:** `src/app/api/contact-requests/route.ts`

## Acceptance Criteria

- [ ] PATCH rejects requests where player's club_id doesn't match admin's club_id
- [ ] Platform admins can still update any request
- [ ] Valid club admin updates still work

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Security Sentinel M2 |
