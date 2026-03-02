---
status: pending
priority: p2
issue_id: "014"
tags: [code-review, performance, database]
dependencies: []
---

# Missing Database Index on players.date_of_birth

## Problem Statement

Age-to-DOB filtering was added across multiple endpoints using `date_of_birth` range comparisons, but there is no index on this column. At scale (37,000+ players), these become sequential scans.

## Findings

**Source:** Performance Oracle (Optimization #4)

**Expected improvement:** 10-50x on DOB-filtered queries at scale.

## Proposed Solutions

```sql
CREATE INDEX idx_players_dob ON public.players(date_of_birth);
```

- **Effort:** Small (single-line migration)
- **Risk:** None

## Acceptance Criteria

- [ ] Index exists on `players.date_of_birth`
- [ ] Migration applies cleanly

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
