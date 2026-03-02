---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# RPC Result Type Cast Without Zod Validation

## Problem Statement

`transfer-helpers.ts` line 59 uses a raw `as` cast on the RPC response: `data as { error?: string; success?: boolean } | null`. If the RPC function's return shape changes, this will silently pass wrong data.

## Findings

**Source:** TypeScript Reviewer (Critical #1)

**Location:** `src/lib/transfer-helpers.ts`, line 59

## Proposed Solutions

Add a Zod schema for the RPC result:
```typescript
const transferRpcResultSchema = z.object({
  success: z.boolean().optional(),
  error: z.string().optional(),
}).nullable()

const parsed = transferRpcResultSchema.safeParse(data)
if (!parsed.success) { return { error: 'errors.serverError' } }
const result = parsed.data
```

- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] RPC result validated with Zod schema
- [ ] No `as` cast on RPC response
- [ ] Invalid RPC responses handled gracefully

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - TypeScript Reviewer |
