---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, injection]
dependencies: []
---

# PostgREST Filter Injection in /api/matches

## Problem Statement

The `club` query parameter in `/api/matches/route.ts` is interpolated directly into a PostgREST `.or()` filter string without UUID validation. An attacker can craft a `club` value containing PostgREST operators to manipulate query logic.

**Why it matters:** This is a data exfiltration vector. An attacker could bypass the club filter entirely and return all matches, or craft more complex filter injections.

## Findings

**Source:** Security Sentinel + Learnings Researcher (known pattern from prior chat system review)

**Location:** `src/app/api/matches/route.ts`, line 32

```typescript
if (club) {
  query = query.or(`home_club_id.eq.${club},away_club_id.eq.${club}`)
}
```

**Proof of concept:** `GET /api/matches?club=anything,id.neq.00000000-0000-0000-0000-000000000000` bypasses the club filter entirely.

**Known pattern:** The same class of vulnerability was fixed in the search API (documented in `docs/plans/2026-03-02-refactor-full-codebase-review-fixes-plan.md`), but this instance was missed.

## Proposed Solutions

### Option A: UUID Validation (Recommended)
Add `uuidSchema.safeParse(club)` before interpolation.

```typescript
import { uuidSchema } from '@/lib/validations'
if (club) {
  if (!uuidSchema.safeParse(club).success) {
    return apiError('errors.invalidInput', 400)
  }
  query = query.or(`home_club_id.eq.${club},away_club_id.eq.${club}`)
}
```

- **Pros:** Minimal change, consistent with other endpoints that already validate UUIDs
- **Cons:** None
- **Effort:** Small (5 minutes)
- **Risk:** None

## Recommended Action

Option A. This is a 3-line fix.

## Technical Details

- **Affected files:** `src/app/api/matches/route.ts`
- **Components:** REST API matches endpoint
- **Database changes:** None

## Acceptance Criteria

- [ ] `club` parameter validated as UUID before use in `.or()` filter
- [ ] Invalid `club` values return 400 error
- [ ] Valid UUID club filter still works correctly

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Security Sentinel finding H1 |

## Resources

- OWASP A03:2021 - Injection
- Prior fix: `docs/plans/2026-03-02-refactor-full-codebase-review-fixes-plan.md`
