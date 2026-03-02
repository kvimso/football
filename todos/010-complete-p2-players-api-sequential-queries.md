---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, performance]
dependencies: []
---

# Sequential Queries in /api/players/[id] Should Be Parallelized

## Problem Statement

The player detail API endpoint runs view count RPC and similar players query sequentially, when they are independent and can run in `Promise.all()`. This adds 20-80ms unnecessary latency per request.

## Findings

**Source:** Performance Oracle (Critical #2)

**Location:** `src/app/api/players/[id]/route.ts`

Note: The server component at `src/app/(platform)/players/[slug]/page.tsx` already does this correctly with `Promise.all()`.

## Proposed Solutions

```typescript
const [viewCountResult, similarResult] = await Promise.all([
  supabase.rpc('get_player_view_counts', { player_ids: [player.id] }),
  supabase.from('players').select(...).eq('position', player.position)...
])
```

- **Effort:** Small (5 minutes)
- **Risk:** None

## Acceptance Criteria

- [ ] View count and similar players queries run in parallel
- [ ] Response data unchanged

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
