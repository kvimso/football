---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, performance, database]
dependencies: []
---

# 500-Row Client-Side Filtering in /api/players

## Problem Statement

When stat filters are active or `sort=most_viewed` is used, the API fetches up to 500 players with full joins, then filters and paginates in JavaScript. At scale (37,000+ players), this will cause multi-MB payloads, full table scans, and truncated results.

## Findings

**Source:** Performance Oracle (Critical #1)

**Location:** `src/app/api/players/route.ts`, lines 109-118; also `src/app/(platform)/players/page.tsx`

```typescript
if (!hasStatFilter && sort !== 'most_viewed') {
  query = query.range(from, from + limit - 1)
} else {
  query = query.limit(500)  // Fetch all, filter in JS
}
```

## Proposed Solutions

### Option A: Database RPC/View for Stat Filtering
Create a database function that joins players with season_stats and filters at SQL level.

### Option B: Materialized View for Most Viewed
Create a cached `view_count` column on players table, updated by trigger.

- **Effort:** Medium-Large
- **Risk:** Low (additive database changes)

## Acceptance Criteria

- [ ] Stat-filtered queries use database-level filtering
- [ ] No 500-row hard cap on filtered results
- [ ] Pagination works correctly with filters

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
