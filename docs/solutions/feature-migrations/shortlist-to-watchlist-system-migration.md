---
title: "Shortlist to Watchlist System Migration"
date: 2026-03-05
category: feature-migrations
tags:
  - watchlist
  - data-migration
  - database-schema
  - server-actions
  - ui-components
  - translations
  - supabase-rls
severity: medium
components:
  - supabase/migrations/20250101000036_create_watchlist_system.sql
  - src/app/actions/watchlist.ts
  - src/app/actions/watchlist-folders.ts
  - src/app/actions/watchlist-tags.ts
  - src/components/player/WatchButton.tsx
  - src/components/dashboard/WatchlistList.tsx
  - src/app/dashboard/watchlist/page.tsx
  - src/app/(platform)/players/page.tsx
  - src/app/(platform)/players/[slug]/page.tsx
  - src/components/player/PlayerCard.tsx
  - src/lib/translations/core.ts
  - src/lib/translations/admin.ts
  - src/lib/translations/landing.ts
resolved: true
resolution_type: architecture-change
---

# Shortlist to Watchlist System Migration

## Problem & Motivation

The existing shortlist system had limitations:

- **Single flat list** — scouts couldn't organize saved players into categories
- **Limited metadata** — only notes, no tags or folder grouping
- **Tight coupling to `scout_id`** — couldn't extend to other user roles easily
- **Redundant API layer** — `/api/shortlist/route.ts` duplicated server action logic
- **No organizational tools** — no way to categorize by position, potential, priority

The watchlist system replaces it with a structured four-table architecture supporting folders, tags, and a more generic `user_id` model.

## Solution Overview

Replaced the entire shortlist system in one commit (`feat/watchlist-system` branch):

| Layer | Old (Shortlist) | New (Watchlist) |
|-------|----------------|-----------------|
| Database | 1 table (`shortlists`) | 4 tables (`watchlist`, `watchlist_folders`, `watchlist_folder_players`, `watchlist_tags`) |
| Column | `scout_id` | `user_id` (generic) |
| Actions | `src/app/actions/shortlist.ts` | 3 files: `watchlist.ts`, `watchlist-folders.ts`, `watchlist-tags.ts` |
| API | `/api/shortlist/route.ts` | Removed (server actions only) |
| Component | `ShortlistButton` | `WatchButton` + star icon in `PlayerCard` |
| Dashboard | `/dashboard/shortlist` | `/dashboard/watchlist` |
| Translations | `shortlist.*` keys | `watchlist.*` keys (en + ka) |

## Key Implementation Details

### Database Schema

```sql
-- Core table (replaces shortlists)
CREATE TABLE watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, player_id)
);

-- Organizational: folders (max 20 per user, enforced at app level)
CREATE TABLE watchlist_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Junction: many-to-many folder-player assignments
CREATE TABLE watchlist_folder_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL REFERENCES watchlist_folders(id) ON DELETE CASCADE,
  watchlist_id uuid NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  UNIQUE(folder_id, watchlist_id)
);

-- Tags: lightweight metadata (max 10 per entry, 30 chars, auto-lowercased)
CREATE TABLE watchlist_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  watchlist_id uuid NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (char_length(tag) <= 30)
);
```

### RLS Policies

- **Direct tables** (`watchlist`, `watchlist_folders`, `watchlist_tags`): `auth.uid() = user_id`
- **Junction table** (`watchlist_folder_players`): Subquery-based — `folder_id IN (SELECT id FROM watchlist_folders WHERE user_id = auth.uid())`

### Data Migration

```sql
INSERT INTO public.watchlist (user_id, player_id, notes, created_at)
SELECT scout_id, player_id, notes, created_at
FROM public.shortlists
WHERE scout_id IS NOT NULL AND player_id IS NOT NULL
ON CONFLICT (user_id, player_id) DO NOTHING;
```

3 existing shortlist entries migrated successfully.

### Server Actions Pattern

All actions follow: validate (Zod) -> auth check -> DB operation -> revalidatePath

```typescript
// Duplicate insert handled gracefully (idempotent)
if (error?.code === '23505') return { error: 'errors.alreadyWatched' }
```

### PlayerCard Watch Star Integration

Watch star nested inside `<Link>` requires event handling:

```typescript
<button
  onClick={(e) => {
    e.preventDefault()      // Prevent Link navigation
    e.stopPropagation()     // Stop event bubbling
    handleWatch()
  }}
>
  {isWatched ? '★' : '☆'}
</button>
```

`isWatched` is optional so PlayerCard works in contexts without watchlist data (e.g., similar players section).

### Data Flow (Player Directory)

Server component fetches all user watchlist IDs in one query, passes through `PlayerDirectoryClient` to each `PlayerCard` as `isWatched` prop. Avoids N+1.

## Design Decisions

1. **`user_id` over `scout_id`** — Generic for future role expansion
2. **No cascade from folders to watchlist** — Deleting a folder removes assignments, not the watched entry itself
3. **Tag auto-normalization** — `tag.toLowerCase().trim()` prevents duplicates
4. **Folder limit (20) and tag limit (10)** — Enforced at application level via count queries
5. **Duplicate insert = success** — PostgreSQL 23505 error treated as idempotent, not failure
6. **Optional `isWatched` prop** — PlayerCard renders watch star only when prop is defined

## Files Deleted

- `src/app/actions/shortlist.ts`
- `src/app/api/shortlist/route.ts`
- `src/components/player/ShortlistButton.tsx`
- `src/components/dashboard/ShortlistList.tsx`
- `src/app/dashboard/shortlist/page.tsx`
- `src/app/dashboard/shortlist/loading.tsx`

## Prevention Strategies

### For Future Table Migrations

**FK naming in Supabase `.select()` joins:**
When querying with joins, the FK constraint name must match the new table. After migration, always verify:
```bash
grep -r "shortlists_" src/ --include="*.ts" --include="*.tsx" | grep -v database.types.ts
```

**Translation key cleanup checklist:**
1. Add new keys to all language files first
2. Update code references
3. Grep to verify old keys are unused
4. Remove old keys
5. Test both languages

**RLS for junction tables:**
Tables without direct `user_id` need subquery-based policies. Always test these separately — they're the most common source of silent permission failures.

**Nested interactive elements:**
When adding click handlers inside `<Link>`, always use `e.preventDefault()` + `e.stopPropagation()`.

**Optional props for shared components:**
When a component appears in multiple contexts (some with feature data, some without), make feature-specific props optional and conditionally render.

### Migration Checklist

- [ ] Pre-migration data audit (count source records)
- [ ] Migration includes `ON CONFLICT DO NOTHING` for safety
- [ ] Post-migration count verification
- [ ] All FK constraint names updated in `.select()` queries
- [ ] All translation files updated (every language)
- [ ] Old files deleted
- [ ] `npm run build` passes
- [ ] Grep confirms zero remaining old references
- [ ] Types regenerated: `npx supabase gen types typescript`

## Cross-References

- [Chat System RLS Policy Fixes](../database-issues/chat-system-rls-policy-and-displayname-fixes.md) — RLS checklist for feature migrations
- [Chat System Code Review Fixes](../security-issues/chat-system-code-review-fixes.md) — N+1 prevention patterns, scoped SELECT policies
- [Comprehensive Audit Fixes](../security-issues/comprehensive-audit-security-code-quality-fixes.md) — Dead code cleanup patterns
- `CLAUDE.md` Permission Model section — scout-scoped access rules

## Result

**Commit:** `264499c feat(watchlist): replace shortlist system with unified watchlist`
- 23 files changed, 875 insertions, 557 deletions
- 4 new database tables with RLS
- 3 new server action files
- 2 new components (WatchButton, WatchlistList)
- Data migrated, build clean, all translations updated
