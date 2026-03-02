---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, security, database]
dependencies: []
---

# Missing SET search_path on Guardian Contact RPC

## Problem Statement

The `get_player_guardian_contact` function uses `SECURITY DEFINER` but does not set `search_path = public`. Without an explicit search_path, a malicious user could shadow `public.players` or `public.profiles` to cause the function to operate on wrong data.

## Findings

**Source:** Data Integrity Guardian (Finding 1)

**Location:** `supabase/migrations/20250101000033_protect_guardian_contact.sql`

All other SECURITY DEFINER functions in migrations 0030 and 0035 include `SET search_path = public`. This one was missed.

## Proposed Solutions

New migration:
```sql
CREATE OR REPLACE FUNCTION public.get_player_guardian_contact(p_player_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$ ... $$;
```

- **Effort:** Small (single migration)
- **Risk:** None

## Acceptance Criteria

- [ ] Function includes `SET search_path = public`
- [ ] Migration applies cleanly

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-02 | Created | From code review - Data Integrity Guardian |
