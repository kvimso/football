---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, performance, database]
dependencies: []
---

# N+1-Adjacent Pattern for Player Counts in /api/clubs

## Problem Statement

The clubs API fetches every player ID for every club (`players(id)`) then counts them in JavaScript. At scale (37,000+ players), this transfers thousands of `{id}` objects just to count them.

## Findings

**Source:** Performance Oracle (Critical #3)

**Location:** `src/app/api/clubs/route.ts`, lines 14-32

## Proposed Solutions

Use Supabase count or a pre-computed column:
```typescript
.select(`..., players!players_club_id_fkey(count)`, { count: 'exact' })
```

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Player counts computed without fetching all player IDs
- [ ] Club list response includes accurate player_count

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
