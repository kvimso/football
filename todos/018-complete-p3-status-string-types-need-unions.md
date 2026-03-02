---
status: pending
priority: p3
issue_id: "018"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Status Props Use string Instead of Union Types

## Problem Statement

`TransferCard.tsx` and `TransferTabs.tsx` use `status: string` and `Record<string, ...>` where proper union types (`'pending' | 'accepted' | 'declined' | 'expired'`) would provide type safety.

## Findings

**Source:** TypeScript Reviewer (Moderate #12)

**Locations:**
- `src/components/admin/TransferCard.tsx` (lines 16, 51)
- `src/components/admin/TransferTabs.tsx` (line 9)

## Proposed Solutions

Define and use a `TransferStatus` union type.

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Transfer status uses union type, not `string`
- [ ] `npm run build` passes

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - TypeScript Reviewer |
