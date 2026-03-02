---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, code-quality, duplication]
dependencies: []
---

# season_stats Array Normalization Duplicated 6+ Times

## Problem Statement

The pattern `Array.isArray(p.season_stats) ? p.season_stats : p.season_stats ? [p.season_stats] : []` is repeated verbatim in 6+ files. This is not premature abstraction — it's the exact same expression.

## Findings

**Source:** TypeScript Reviewer (Major #6)

**Locations:**
- `src/app/api/players/route.ts` (lines 139, 152)
- `src/app/api/players/[id]/route.ts` (lines 54-56)
- `src/app/api/clubs/[slug]/route.ts` (line 46)
- `src/app/api/shortlist/route.ts` (line 46)
- `src/app/(platform)/players/[slug]/page.tsx`

## Proposed Solutions

Extract into `src/lib/utils.ts`:
```typescript
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}
```

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] `normalizeToArray` utility exists in utils.ts
- [ ] All 6+ occurrences replaced
- [ ] `npm run build` passes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - TypeScript Reviewer |
