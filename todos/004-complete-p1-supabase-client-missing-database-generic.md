---
status: pending
priority: p1
issue_id: "004"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# SupabaseClient Missing Database Generic in transfer-helpers.ts

## Problem Statement

All three functions in `transfer-helpers.ts` accept `SupabaseClient` without the `Database` generic parameter. This means `.from()`, `.rpc()`, and other Supabase methods have no table-level type safety — column names, insert shapes, and RPC parameters are effectively `any`.

**Why it matters:** Type-unsafe Supabase calls can silently pass wrong column names or invalid data shapes without compile-time errors.

## Findings

**Source:** TypeScript Reviewer (Critical #3)

**Location:** `src/lib/transfer-helpers.ts`, lines 1, 8, 28, 47, 69

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export async function recordClubJoin(
  client: SupabaseClient,  // Missing Database generic
```

Compare with `api-utils.ts` which correctly uses `SupabaseClient<Database>`.

## Proposed Solutions

### Option A: Add Database Generic (Recommended)

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export async function recordClubJoin(
  client: SupabaseClient<Database>,
  ...
```

- **Pros:** Full type safety on all Supabase calls
- **Cons:** None
- **Effort:** Small (change 3 function signatures + 1 import)
- **Risk:** None

## Technical Details

- **Affected files:** `src/lib/transfer-helpers.ts`

## Acceptance Criteria

- [ ] All 3 functions use `SupabaseClient<Database>` parameter type
- [ ] `npm run build` passes with no new type errors

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - TypeScript Reviewer |
