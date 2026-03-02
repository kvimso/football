---
status: pending
priority: p3
issue_id: "017"
tags: [code-review, bug, ui]
dependencies: []
---

# DashboardScoutActivity Duplicate Label in Empty State

## Problem Statement

The empty state renders the same `noActivityLabel` string twice — once as heading and once as subtitle. This is likely a bug.

## Findings

**Source:** Code Simplicity Reviewer (Bug)

**Location:** `src/components/admin/DashboardScoutActivity.tsx`, line 59

```tsx
<p className="mt-3 text-sm font-medium text-foreground-muted">{noActivityLabel}</p>
<p className="mt-1 text-xs text-foreground-muted/60">{noActivityLabel}</p>
```

## Proposed Solutions

Remove the second `<p>` or use a different subtitle string.

- **Effort:** Small (1 line)
- **Risk:** None

## Acceptance Criteria

- [ ] Empty state shows one label, not duplicate text

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Code Simplicity Reviewer |
