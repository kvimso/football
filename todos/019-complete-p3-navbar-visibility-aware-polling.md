---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, performance]
dependencies: []
---

# Navbar Unread Polling Should Be Visibility-Aware

## Problem Statement

The Navbar polls `get_total_unread_count` every 30 seconds even when the browser tab is hidden, causing unnecessary database calls from idle tabs.

## Findings

**Source:** Performance Oracle (Optimization #7)

**Location:** `src/components/layout/Navbar.tsx`

## Proposed Solutions

Use `document.visibilitychange` to pause/resume polling when tab is hidden/visible.

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Polling pauses when tab is hidden
- [ ] Polling resumes when tab becomes visible
- [ ] Badge updates correctly after tab switch

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Performance Oracle |
