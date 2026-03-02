---
status: pending
priority: p2
issue_id: "012"
tags: [code-review, architecture, duplication]
dependencies: []
---

# Business Logic Duplication Between Server Actions and API Routes

## Problem Statement

Player CRUD and transfer request creation logic exists in both server actions (`src/app/actions/`) and API routes (`src/app/api/`). A bug fix or business rule change applied to one but not the other will create inconsistency.

## Findings

**Source:** Architecture Strategist (Medium Risk #1) + Code Simplicity Reviewer

**Affected pairs:**
- `admin-transfers.ts` requestTransfer ↔ `POST /api/transfers` handleCreateRequest
- `admin-players.ts` createPlayer ↔ `POST /api/admin/players`
- `admin-players.ts` updatePlayer ↔ `PUT /api/admin/players`
- `admin-transfers.ts` claimFreeAgent ↔ `POST /api/transfers` handleClaimFreeAgent

**Good example:** `transfer-helpers.ts` (`executeTransferAccept`, `executeTransferDecline`) already demonstrates the correct pattern — shared domain logic consumed by both layers.

## Proposed Solutions

Extract shared domain functions into `src/lib/` following the `transfer-helpers.ts` pattern. Both server actions and API routes call these shared functions.

- **Effort:** Medium
- **Risk:** Low (refactoring, same behavior)

## Acceptance Criteria

- [ ] Core business logic for transfers and player CRUD lives in `src/lib/`
- [ ] Server actions and API routes both call shared functions
- [ ] No duplicated validation or business rules

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Architecture Strategist |
