---
title: "Camera Integration Session 2: Platform Admin Camera UI"
type: feat
status: completed
date: 2026-03-19
origin: docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md
---

# Camera Integration Session 2: Platform Admin Camera UI

## Enhancement Summary

**Deepened on:** 2026-03-19
**Agents used:** 5 completed (security-sentinel, performance-oracle, kieran-typescript-reviewer, code-simplicity-reviewer, pattern-recognition-specialist partially) + 8 hit rate limits

### Critical Fixes Required (4)

1. **Reuse existing `PlayerSearchSelect` component** instead of building a custom combobox. The component already exists at `src/components/player/PlayerSearchSelect.tsx` with server-side debounced search via `/api/players/search`. Loading all players into a dropdown will break at 200+ players. *(Performance Oracle)*
2. **Query unmapped players via `status = 'skipped' AND sync_type = 'player'`**, not JSONB text search on error strings. Add composite index `idx_sync_logs_type_status ON sync_logs(sync_type, status)`. *(Performance Oracle)*
3. **Guard `mapped_by` server-side only** — always set from `getPlatformAdminContext().userId`, never accept from form data. *(Security Sentinel)*
4. **Add composite index for sync log pagination** — `idx_sync_logs_status_date ON sync_logs(status, created_at DESC)` for filtered+sorted+paginated queries. *(Performance Oracle)*

### High-Priority Improvements (6)

5. **Tighten Zod schemas** — add `.max(2147483647)` on int fields (PostgreSQL int4 limit), `.trim()` on `starlive_team_name` (prevents whitespace duplicate entries), `.regex(/^[0-9A-Za-z\-]+$/)` on `jersey_number`. *(Security Sentinel)*
6. **Use discriminated unions for ActionResult** — `{ success: true } | { success: false; error: string }` instead of loose `{ success?: boolean; error?: string }`. Forces exhaustive checking at call sites. *(TypeScript Reviewer)*
7. **Derive all row types from `database.types.ts`** — `type SyncLogRow = Database['public']['Tables']['sync_logs']['Row']`. Never hand-define parallel types that drift. *(TypeScript Reviewer)*
8. **Client-side file size check** in SyncTrigger before `FileReader.readAsText()` — prevents browser hanging on oversized files. `if (file.size > 10 * 1024 * 1024) setError(...)`. *(Security Sentinel)*
9. **Select specific columns for sync log list** — exclude `errors` JSONB in the list query. Fetch errors only when user expands a row. Reduces payload by 60-80%. *(Performance Oracle)*
10. **Validate pagination search params** — use `parseIntParam()` (already in `api-utils.ts`) for page numbers, allow-list for status filter values. *(Security Sentinel)*

### Simplifications (defer or remove, -7 files)

11. **Defer unmapped players section** entirely — zero syncs have run, no unmapped data exists yet. Build this when real sync data arrives. *(Simplicity)*
12. **Defer club filter on player mappings** — with 3 clubs and <20 mappings, filtering is unnecessary. *(Simplicity)*
13. **Defer status filter on sync logs** — with <100 logs for months, show all in reverse chronological order. *(Simplicity)*
14. **Use plain `<select>` for club dropdown** in club mapping form — max ~20 clubs, no search needed. *(Simplicity)*

### TypeScript Quality (4)

15. **Validate JSONB `errors` at boundary** with Zod, then trust typed result downstream. Never cast `Json` to a specific type. *(TypeScript Reviewer)*
16. **Use `z.infer<typeof schema>`** for form data types — no separate interfaces. *(TypeScript Reviewer)*
17. **Guard `JSON.parse` results** in SyncTrigger by assigning to `unknown` and validating with Zod before use. *(TypeScript Reviewer)*
18. **Test `z.coerce.number()` edge case** where empty string coerces to `0` and passes `.min(1)`. *(TypeScript Reviewer)*

### New Database Objects (from Performance Oracle)

19. **Add 3 indexes in a small migration** `20250101000042_camera_admin_indexes.sql`:
    - `idx_sync_logs_status_date ON sync_logs(status, created_at DESC)` — filtered pagination
    - `idx_sync_logs_type_status ON sync_logs(sync_type, status)` — unmapped players query
    - `idx_spm_club ON starlive_player_map(club_id)` — club-filtered mapping lookups

---

## Overview

Session 2 builds the platform admin interface for managing Starlive camera mappings and monitoring sync operations. This is the admin tooling layer on top of Session 1's database schema and sync backend. Three new sub-pages under `/platform/camera/` let the platform admin map Starlive player IDs and team names to our database, trigger manual data syncs, and review sync history.

**Session 2 does NOT include:** Player profile stats UI, match report visualizations, heatmap rendering, radar chart updates, or comparison tool changes. Those are Sessions 3-5.

## Problem Statement / Motivation

The camera sync system (Session 1) requires manual mappings between Starlive's player IDs / team names and our platform's UUIDs. Without admin pages to manage these mappings, the platform admin must use Supabase Studio directly — error-prone and not scalable. Additionally, the sync dashboard gives visibility into sync health, failed operations, and unmapped players.

## Proposed Solution

Three pages under `/platform/camera/` with a shared sub-tab layout, following all existing platform admin conventions:

1. **Player Mappings** — CRUD for `starlive_player_map` with searchable player selection
2. **Club Mappings** — CRUD for `starlive_club_map`
3. **Sync Dashboard** — Manual sync trigger (JSON file upload) + sync log viewer with expandable errors

## Technical Approach

### Architecture

```
src/app/platform/camera/
├── layout.tsx              ← Sub-tab navigation (Mappings | Clubs | Sync)
├── page.tsx                ← Redirect to /mappings
├── mappings/
│   ├── page.tsx            ← Player mapping list (server component)
│   ├── new/page.tsx        ← Add mapping form
│   ├── [id]/edit/page.tsx  ← Edit mapping form
│   └── loading.tsx         ← Skeleton
├── clubs/
│   ├── page.tsx            ← Club mapping list (server component)
│   ├── new/page.tsx        ← Add club mapping form
│   ├── [id]/edit/page.tsx  ← Edit club mapping form
│   └── loading.tsx         ← Skeleton
└── sync/
    ├── page.tsx            ← Sync dashboard (server + client hybrid)
    └── loading.tsx         ← Skeleton
```

Supporting files:
```
src/app/actions/platform-camera.ts     ← Server actions (CRUD + sync trigger)
src/components/platform/
├── PlayerMappingForm.tsx              ← Create/edit player mapping
├── ClubMappingForm.tsx                ← Create/edit club mapping
├── SyncTrigger.tsx                    ← File upload + sync trigger
└── SyncLogTable.tsx                   ← Expandable sync history
src/lib/validations.ts                 ← + mapping schemas
src/lib/translations/admin.ts          ← + camera translation keys
src/components/platform/PlatformSidebar.tsx  ← + Camera link
```

### Key Design Decisions

**1. Single sidebar link with sub-tabs (not 3 sidebar entries)**
Adding 3 entries to the sidebar makes 10 total, causing mobile horizontal scroll overflow. Instead: one "Camera" link → `/platform/camera` with a sub-tab layout (`layout.tsx`) containing 3 tabs: Player Mappings | Club Mappings | Sync.

**2. Server components for list pages (direct Supabase queries, no API route)**
All existing platform pages query Supabase directly via `createAdminClient()`. The deferred `GET /api/camera/sync-logs` API route from Session 1 is unnecessary — use the established server component pattern instead. Pagination via URL search params.

**3. Separate new/edit pages (not modals)**
Follows existing pattern: `/platform/clubs/new`, `/platform/clubs/[id]/edit`. Consistent, bookmarkable, simpler state management.

**4. Reuse existing `PlayerSearchSelect` for player dropdown** *(changed by Performance Oracle)*
The codebase already has `src/components/player/PlayerSearchSelect.tsx` with debounced server-side search via `/api/players/search` (LIMIT 15, ilike filter). Reuse this instead of loading all players or building a custom combobox. Works at any scale, already tested, zero new code needed.

**5. File upload for manual sync (not textarea)**
Starlive JSON files can be up to 10MB. Textarea paste is impractical. File upload with `<input type="file" accept=".json">` + sync type selector + optional match_id field. Add client-side `file.size > 10MB` check before FileReader to prevent browser hanging.

**6. Defer unmapped players section** *(changed by Simplicity Reviewer)*
Zero syncs have run — there is no unmapped player data to display. Build this when real sync data arrives and the need is proven. For now, the admin can see unmapped player errors in the sync log details.

### Implementation Phases

#### Phase A: Foundation — Layout, Sidebar, Redirect (3 files)

**1. `src/app/platform/camera/layout.tsx`**

Server component. Wraps camera sub-pages with a tab bar:

```tsx
// Server component — no auth check needed (parent /platform/layout.tsx handles it)
// Sub-tab navigation: Player Mappings | Club Mappings | Sync
// Use Link components with active state based on pathname
// Pattern: horizontal tabs above content, active tab has border-b-2 border-primary
```

Tabs:
| Label Key | Href | Active when |
|-----------|------|-------------|
| `platform.camera.tabs.mappings` | `/platform/camera/mappings` | `pathname.startsWith('/platform/camera/mappings')` |
| `platform.camera.tabs.clubs` | `/platform/camera/clubs` | `pathname.startsWith('/platform/camera/clubs')` |
| `platform.camera.tabs.sync` | `/platform/camera/sync` | `pathname.startsWith('/platform/camera/sync')` |

**Note:** This layout needs to be a client component (for `usePathname()`), similar to how `PlatformSidebar.tsx` works. Wrap only the nav part in a client component; the children render as server components.

Actually, to keep it clean: make the entire `layout.tsx` a client component since it's just rendering tabs + `{children}`. The children (page.tsx files) are server components — the client boundary doesn't affect them.

**2. `src/app/platform/camera/page.tsx`**

Simple redirect:
```tsx
import { redirect } from 'next/navigation'
export default function CameraPage() {
  redirect('/platform/camera/mappings')
}
```

**3. `src/components/platform/PlatformSidebar.tsx`** (MODIFY)

Add one new link entry to the `links` array:

```ts
{
  href: '/platform/camera',
  labelKey: 'platform.nav.camera',
  icon: 'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
}
```

Position: after "Transfers", before "Invite Admin" (camera is a core feature, invite is setup-only).

#### Phase B: Validation Schemas (1 file)

**`src/lib/validations.ts`** (MODIFY)

Add schemas:

```ts
export const playerMappingSchema = z.object({
  player_id: z.string().uuid('Invalid player ID'),
  starlive_player_id: z.coerce.number().int().positive('Starlive player ID must be a positive integer').max(2147483647),
  starlive_team_id: z.coerce.number().int().positive().max(2147483647).optional().nullable(),
  club_id: z.string().uuid().optional().nullable(),
  jersey_number: z.string().max(10).regex(/^[0-9A-Za-z\-]*$/, 'Alphanumeric only').optional().nullable(),
})

export const clubMappingSchema = z.object({
  club_id: z.string().uuid('Invalid club ID'),
  starlive_team_name: z.string().min(1, 'Team name is required').max(200).trim(),
  starlive_team_id: z.coerce.number().int().positive().max(2147483647).optional().nullable(),
})
```

**Security hardening (from Security Sentinel):**
- `.max(2147483647)` on all int fields — matches PostgreSQL int4 limit, prevents DB errors
- `.trim()` on `starlive_team_name` — prevents whitespace-only duplicates that bypass UNIQUE constraint
- `.regex()` on `jersey_number` — restricts to alphanumeric characters

**TypeScript quality (from TypeScript Reviewer):**
- Use `z.infer<typeof playerMappingSchema>` for form data types — no separate interfaces
- Note: `z.coerce.number()` coerces empty string `""` to `0`, which passes `.positive()`. Test this edge case.

#### Phase C: Server Actions (1 file)

**`src/app/actions/platform-camera.ts`** (NEW)

Follows exact pattern of `platform-clubs.ts`:

```
'use server'
import { getPlatformAdminContext } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { playerMappingSchema, clubMappingSchema, uuidSchema } from '@/lib/validations'
```

**Player mapping actions:**

- `createPlayerMapping(data)` — validate with Zod → `getPlatformAdminContext()` → insert into `starlive_player_map` with `mapped_by: userId` (always from context, never from form data — Security) and `club_id` auto-populated from selected player's current `players.club_id` → `revalidatePath('/platform/camera/mappings')` → return discriminated union
  - **Return type (TypeScript Reviewer):** `{ success: true } | { success: false; error: string }` — discriminated union, not loose optional fields
  - **Duplicate handling:** Check Supabase `error.code === '23505'` (not `error.message` — codes are stable, messages change). Return `{ success: false, error: 'platform.camera.errors.duplicateStarliveId' }`. Never forward raw Supabase error text to client (can leak schema details).
  - **Row types:** Use `Database['public']['Tables']['starlive_player_map']['Insert']` from database.types.ts, not hand-defined types

- `updatePlayerMapping(id, data)` — validate UUID + Zod → auth → update → revalidate → return

- `deletePlayerMapping(id)` — validate UUID → auth → **no cascade check needed** (mapping deletion doesn't affect `match_player_stats` — those reference `player_id` directly) → delete → revalidate → return
  - Show confirmation text in UI: "Deleting this mapping means future syncs for Starlive player ID {X} will log 'unmapped player' warnings. Existing synced data is not affected."

**Club mapping actions:**

- `createClubMapping(data)` — validate → auth → insert → revalidate → return
  - Duplicate handling: unique violation on `starlive_team_name` → `{ error: 'platform.camera.errors.duplicateTeamName' }`

- `updateClubMapping(id, data)` — validate → auth → update → revalidate → return

- `deleteClubMapping(id)` — validate → auth → **warn about consequences** → delete → revalidate → return
  - Before deletion, count `starlive_player_map` rows with matching `club_id` to show in confirmation

#### Phase D: Club Mappings Pages (4 files — simpler, build first)

**1. `src/app/platform/camera/clubs/page.tsx`** (server component)

```
Data: createAdminClient().from('starlive_club_map')
  .select('*, clubs(id, name, name_ka)')
  .order('created_at', { ascending: false })
```

Table columns: Club Name (en/ka) | Starlive Team Name | Starlive Team ID | Created | Actions (Edit link)

Empty state: "No club mappings yet. Add a mapping to connect Starlive team names to your clubs."

Add button: Link to `/platform/camera/clubs/new`

**2. `src/app/platform/camera/clubs/new/page.tsx`** (server component)

- Back link: `← Back to Club Mappings`
- Fetch all clubs via `createAdminClient().from('clubs').select('id, name, name_ka').order('name')`
- Render `<ClubMappingForm clubs={clubs} />`

**3. `src/app/platform/camera/clubs/[id]/edit/page.tsx`** (server component)

- Fetch mapping by `id` with joined club data
- If not found → `notFound()`
- Fetch all clubs for dropdown
- Render `<ClubMappingForm mapping={mapping} clubs={clubs} />`

**4. `src/app/platform/camera/clubs/loading.tsx`** (skeleton)

Standard pattern: `animate-skeleton-in` with `bg-elevated` placeholders.

**5. `src/components/platform/ClubMappingForm.tsx`** (NEW, client component)

Follows `ClubForm.tsx` pattern exactly:
- Props: `{ mapping?: {...}, clubs: Array<{id, name, name_ka}> }`
- `useState` for `error`, `saving`
- Form fields:
  - Club selector: `<select>` with clubs (max ~20 clubs, plain select is fine)
  - Starlive Team Name: `<input type="text">` (required)
  - Starlive Team ID: `<input type="number">` (optional)
- Submit calls `createClubMapping()` or `updateClubMapping()`
- On success: `router.push('/platform/camera/clubs')` + `router.refresh()`

#### Phase E: Player Mappings Pages (5 files)

**1. `src/app/platform/camera/mappings/page.tsx`** (server component)

Data query:
```
createAdminClient().from('starlive_player_map')
  .select('*, players(id, name, name_ka, slug, position, club_id), clubs(id, name)')
  .order('created_at', { ascending: false })
```

Table columns: Player Name (en/ka) | Position | Club | Starlive ID | Jersey | Mapped By | Actions (Edit)

**Deferred — club filter:** With 3 clubs and <20 mappings, filtering is unnecessary (Simplicity). Add when mappings exceed 50+.

**Deferred — unmapped players section:** Zero syncs have run, no unmapped data exists. Build when real sync data arrives. For now, admin can see unmapped player errors in sync log details on the Sync Dashboard tab.

Empty state: "No player mappings yet. Add a mapping to connect Starlive player IDs to your players."

**2. `src/app/platform/camera/mappings/new/page.tsx`** (server component)

- Back link: `← Back to Player Mappings`
- Accept `searchParams` for pre-fill: `starlive_id`, `name`, `team`, `jersey`
- Fetch all players: `createAdminClient().from('players').select('id, name, name_ka, position, club_id, clubs(name)').order('name')`
- Fetch all clubs: for the club dropdown
- Render `<PlayerMappingForm players={players} clubs={clubs} prefill={searchParams} />`

**3. `src/app/platform/camera/mappings/[id]/edit/page.tsx`** (server component)

- Fetch mapping by ID with joined player and club
- If not found → `notFound()`
- Fetch players and clubs for dropdowns
- Render `<PlayerMappingForm mapping={mapping} players={players} clubs={clubs} />`

**4. `src/app/platform/camera/mappings/loading.tsx`** (skeleton)

**5. `src/components/platform/PlayerMappingForm.tsx`** (NEW, client component)

Props:
```ts
interface PlayerMappingFormProps {
  mapping?: { id: string; starlive_player_id: number; player_id: string; starlive_team_id: number | null; club_id: string | null; jersey_number: string | null }
  players: Array<{ id: string; name: string; name_ka: string; position: string; club_id: string | null; clubs: { name: string } | null }>
  clubs: Array<{ id: string; name: string; name_ka: string }>
  prefill?: { starlive_id?: string; name?: string; team?: string; jersey?: string }
}
```

**Player selector — reuse existing `PlayerSearchSelect`** *(Performance Oracle finding)*:
- Component already exists at `src/components/player/PlayerSearchSelect.tsx`
- Uses debounced server-side search via `/api/players/search` (LIMIT 15, ilike filter)
- Works at any scale (12 or 12,000 players), already tested
- On select → stores `player_id` in form state, auto-populate `club_id` from response
- For edit mode: show the already-mapped player's name as initial value

Form fields:
- Player: `<PlayerSearchSelect>` component (reused from existing codebase)
- Starlive Player ID: `<input type="number">` (required)
- Starlive Team ID: `<input type="number">` (optional)
- Jersey Number: `<input type="text">` (optional, informational only)
- Club: auto-populated from selected player (shown as read-only text, not editable)

Submit: calls `createPlayerMapping()` or `updatePlayerMapping()`

#### Phase F: Sync Dashboard (3 files)

**1. `src/app/platform/camera/sync/page.tsx`** (server component)

Top section: `<SyncTrigger />` client component for file upload and manual sync trigger.

Bottom section: Sync log table.

Data query *(optimized per Performance Oracle — exclude JSONB `errors` from list query)*:
```
createAdminClient().from('sync_logs')
  .select('id, sync_type, starlive_id, status, records_synced, records_skipped, duration_ms, triggered_by, created_at')
  .order('created_at', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1)
```

**Errors loaded on expand only:** When user expands a row's details, fetch the `errors` JSONB for that specific row. This reduces list payload by 60-80% (each row's errors can be 1-5KB). Either use a separate server action or include a client-side fetch.

Accept `searchParams`: `?page=1` for pagination. Validate with `parseIntParam()` from `api-utils.ts` (clamp to 1-10000).

**Deferred — status filter:** With <100 logs for months, show all in reverse chronological order (Simplicity). Add filter when logs exceed a few hundred entries.

Table columns: Timestamp | Type | Status (badge) | Synced | Skipped | Duration | Triggered By | Details (expand)

Status badges: use existing `.status-badge` CSS classes:
- `success` → `.status-badge-active` (green)
- `partial` → `.status-badge-pending` (amber)
- `failed` → `.status-badge-rejected` (red)

Pagination: simple prev/next links with page number in URL.

**2. `src/components/platform/SyncTrigger.tsx`** (NEW, client component)

Handles the manual sync upload flow:

```
- Sync type selector: <select> with options: player, match_report, heatmap
- File input: <input type="file" accept=".json">
- Match ID input: shown only when type is 'match_report' or 'heatmap' (required for those types)
  - Plain text input where admin enters the match UUID
  - Helper text: "Find match IDs in the matches table or sync a player profile first"
- Submit button: "Trigger Sync" with loading state
```

On submit *(hardened per Security Sentinel + TypeScript Reviewer)*:
1. **Client-side file size check first:** `if (file.size > 10 * 1024 * 1024) setError('File exceeds 10MB limit'); return;`
2. Read file content with `FileReader`
3. **Guard JSON.parse:** `const raw: unknown = JSON.parse(reader.result as string)` — assign to `unknown`, never `any`
4. **Validate with shared Zod schema:** `syncRequestSchema.safeParse({ type, data: raw, match_id })` — reject malformed data before sending
5. `fetch('/api/camera/sync', { method: 'POST', body: JSON.stringify(parsed.data) })`
6. Show result inline: success message with counts, or error message
7. After success: `router.refresh()` to update the sync log table below

Error handling:
- File too large → client-side error before FileReader (prevents browser hanging)
- Invalid JSON → show parse error
- Zod validation failure → show structural error
- API validation errors → show field-level errors
- Network/timeout → "Sync request timed out. Check sync logs for results."

**3. `src/components/platform/SyncLogTable.tsx`** (NEW, client component)

Why client component: needs expandable/collapsible error details per row.

Props: `{ logs: SyncLogRow[], page: number, hasMore: boolean }`

Each row shows columns. "Details" column has a disclosure toggle (chevron icon). When expanded, shows the `errors` JSONB array as a styled list below the row (using `<details>/<summary>` HTML elements for zero-JS-needed progressive enhancement, styled with Tailwind).

```html
<details>
  <summary className="cursor-pointer text-primary text-xs">View errors ({count})</summary>
  <ul className="mt-2 space-y-1 text-xs text-foreground-muted">
    {errors.map(err => <li key={i}>• {err}</li>)}
  </ul>
</details>
```

**4. `src/app/platform/camera/sync/loading.tsx`** (skeleton)

#### Phase G: Translations (1 file)

**`src/lib/translations/admin.ts`** (MODIFY)

Add `camera` namespace under `platform`:

```ts
platform: {
  // existing keys...
  nav: {
    // existing...
    camera: 'Camera',  // sidebar link
  },
  camera: {
    title: 'Camera Management',
    tabs: {
      mappings: 'Player Mappings',
      clubs: 'Club Mappings',
      sync: 'Sync Dashboard',
    },
    mappings: {
      title: 'Player Mappings',
      description: 'Map Starlive player IDs to platform players',
      addMapping: 'Add Mapping',
      editMapping: 'Edit Mapping',
      noMappings: 'No player mappings yet. Add a mapping to connect Starlive player IDs to your players.',
      player: 'Player',
      starliveId: 'Starlive Player ID',
      starliveTeamId: 'Starlive Team ID',
      jerseyNumber: 'Jersey Number',
      club: 'Club',
      mappedBy: 'Mapped By',
      searchPlayer: 'Search players...',
      selectPlayer: 'Select a player',
      clubAutoPopulated: 'Auto-populated from player',
      deleteConfirm: 'Deleting this mapping means future syncs for this Starlive player ID will log unmapped warnings. Existing synced data is not affected.',
      // Deferred: unmapped, unmappedDescription, mapThisPlayer, noUnmapped — build when real sync data arrives
    },
    clubs: {
      title: 'Club Mappings',
      description: 'Map Starlive team names to platform clubs',
      addMapping: 'Add Mapping',
      editMapping: 'Edit Mapping',
      noMappings: 'No club mappings yet. Add a mapping to connect Starlive team names to your clubs.',
      clubName: 'Club',
      starliveTeamName: 'Starlive Team Name',
      starliveTeamId: 'Starlive Team ID',
      deleteConfirm: 'Deleting this mapping means future syncs for matches with this team name will fail to identify the club.',
      affectedPlayerMappings: 'player mappings use this club',
    },
    sync: {
      title: 'Sync Dashboard',
      description: 'Trigger manual syncs and view sync history',
      trigger: 'Trigger Sync',
      triggerDescription: 'Upload a Starlive JSON file to sync data manually.',
      syncType: 'Sync Type',
      selectFile: 'Select JSON File',
      matchId: 'Match ID',
      matchIdHelp: 'Required for match report and heatmap sync types',
      syncing: 'Syncing...',
      syncSuccess: 'Sync completed successfully',
      syncPartial: 'Sync completed with some errors',
      syncFailed: 'Sync failed',
      history: 'Sync History',
      noLogs: 'No sync logs yet.',
      timestamp: 'Timestamp',
      type: 'Type',
      status: 'Status',
      synced: 'Synced',
      skipped: 'Skipped',
      duration: 'Duration',
      triggeredBy: 'Triggered By',
      details: 'Details',
      viewErrors: 'View errors',
      prev: 'Previous',
      next: 'Next',
      // Deferred: filterAll, filterSuccess, filterPartial, filterFailed — build when logs exceed ~200
    },
    errors: {
      duplicateStarliveId: 'This Starlive player ID is already mapped to another player.',
      duplicateTeamName: 'This Starlive team name is already mapped to another club.',
      mappingNotFound: 'Mapping not found.',
      fileTooLarge: 'File exceeds 10MB limit.',
      invalidJson: 'Invalid JSON file.',
    },
  },
}
```

Georgian translations (`ka` object): same structure, Georgian text for all values.

#### Phase H: Build Verification

1. `npm run build` — must pass with zero TypeScript errors
2. `npm run lint` — zero new warnings in camera files
3. Navigate to `/platform/camera` — verify redirect to mappings
4. Verify sidebar shows Camera link with correct active state
5. Verify sub-tabs navigation works between all 3 pages
6. Verify empty states render correctly
7. Verify forms render and submit (will error on missing data, but should not crash)

## System-Wide Impact

### Interaction Graph

- `/platform/camera/*` pages → `createAdminClient()` → service role reads bypass RLS → returns data from `starlive_player_map`, `starlive_club_map`, `sync_logs` tables
- Server actions → `getPlatformAdminContext()` → verify platform_admin role + get service role client → CRUD operations → `revalidatePath('/platform/camera/*')` → pages re-render with fresh data
- `SyncTrigger` component → `fetch('/api/camera/sync')` → existing Session 1 sync route → sync.ts → DB writes → sync_logs entry → page refresh shows new log
- Parent layout (`/platform/layout.tsx`) handles auth guard — camera sub-pages inherit protection

### Error & Failure Propagation

- Server action errors → `{ error: 'translation.key' }` → form component displays translated error
- Supabase unique constraint violation (code `23505`) → caught in server action → specific error message
- File upload failure → client-side error display in `SyncTrigger`
- Sync timeout → caught in SyncTrigger fetch error handler → generic timeout message + suggest checking sync logs

### State Lifecycle Risks

- **Stale club_id in player mapping**: When a player transfers, the `starlive_player_map.club_id` becomes stale. Mitigation: the UI displays the player's **current** club (from `players.club_id` join), not the mapping's `club_id`. The mapping's `club_id` is only used for filtering.
- **Deleted player with mapping**: `starlive_player_map.player_id` has `ON DELETE CASCADE` — if a player is deleted, the mapping auto-deletes. No orphans.
- **Deleted club with club mapping**: `starlive_club_map.club_id` has `ON DELETE CASCADE` — same cascade protection.

## Acceptance Criteria

### Functional Requirements

- [x] Platform sidebar shows "Camera" link between Transfers and Invite Admin
- [x] `/platform/camera` redirects to `/platform/camera/mappings`
- [x] Sub-tab navigation works between Player Mappings, Club Mappings, Sync Dashboard
- [x] Active tab highlighted correctly based on current route
- [x] **Player Mappings**: List all `starlive_player_map` entries with joined player name, club, position
- [x] ~~**Player Mappings**: Filter by club via URL search param~~ — DEFERRED (Simplicity)
- [x] **Player Mappings**: Add new mapping with search-based player select (server-side search via /api/players/search)
- [x] **Player Mappings**: Edit existing mapping
- [x] **Player Mappings**: Delete mapping with confirmation
- [x] ~~**Player Mappings**: Unmapped players section~~ — DEFERRED (Simplicity: zero syncs exist)
- [x] ~~**Player Mappings**: "Map this player" link~~ — DEFERRED (depends on unmapped section)
- [x] **Player Mappings**: `mapped_by` auto-set to current admin's profile ID (server-side only — Security)
- [x] **Player Mappings**: `club_id` auto-populated from selected player's current club
- [x] **Club Mappings**: List all `starlive_club_map` entries with joined club name
- [x] **Club Mappings**: Add new mapping with club dropdown
- [x] **Club Mappings**: Edit/delete with confirmation
- [x] **Club Mappings**: Delete confirmation shows count of affected player mappings
- [x] **Sync Dashboard**: File upload with sync type selector
- [x] **Sync Dashboard**: Match ID field shown for match_report and heatmap types
- [x] **Sync Dashboard**: Loading state during sync, result shown after
- [x] **Sync Dashboard**: Sync log table with timestamp, type, status badge, counts
- [x] **Sync Dashboard**: Expandable error details per log entry
- [x] **Sync Dashboard**: Pagination (25 per page) with validated search params
- [x] ~~**Sync Dashboard**: Status filter~~ — DEFERRED (Simplicity: <100 logs for months)
- [x] **Sync Dashboard**: Sync log query excludes `errors` JSONB (Performance — loaded on expand only)
- [x] All new translation keys have both `en` and `ka` values
- [x] Duplicate Starlive ID/team name shows specific error message (check `error.code === '23505'`, not message)
- [x] Server actions use discriminated union returns: `{ success: true } | { success: false; error: string }`
- [x] All row types derived from `database.types.ts` — no hand-defined parallel types
- [x] `mapped_by` set from `getPlatformAdminContext().userId` — never from form data
- [x] Client-side file size check in SyncTrigger before FileReader
- [x] Migration 000043 adds 3 composite indexes for admin queries (000042 was taken by review fixes)
- [x] Loading skeletons for all 3 camera sub-pages
- [x] Empty states for all 3 pages when no data exists

### Non-Functional Requirements

- [x] `npm run build` passes with zero errors
- [x] `npm run lint` — zero new warnings
- [x] All pages mobile-responsive (tables horizontally scrollable, forms stack vertically)
- [x] No `any` types in new code
- [x] Server actions validate all inputs with Zod
- [x] No client-side data fetching except for the sync trigger API call

### Quality Gates

- [x] `npm run build` clean
- [x] Code review agent run on all new files (3+ files = self-review per CLAUDE.md)

## Dependencies & Prerequisites

- **Session 1 must be complete**: migration 000041 applied, `starlive_player_map`/`starlive_club_map`/`sync_logs` tables exist, `/api/camera/sync` route works
- No Starlive API access needed — admin pages are pure CRUD on local tables
- No external libraries needed — everything built with existing stack

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Searchable player dropdown complex to build | Medium | Keep it simple: text input + filtered list, no virtual scrolling needed for <100 players |
| Sync log table grows large | Low | Server-side pagination with 25/page. Status filter reduces result set. |
| Unmapped player regex parsing breaks | Low | Regex matches a known format from sync.ts. If format changes, regex update is trivial. |
| Vercel function timeout on large sync | Medium | Document limitation. Consider chunking in future. Current max payload is 10MB. |
| Mobile sidebar overflow | Prevented | Single "Camera" link instead of 3 separate entries |

## SpecFlow Analysis Findings

Key decisions from SpecFlow analysis (28 gaps identified, all resolved):

1. **Navigation**: Single sidebar link + sub-tabs layout (Gap 1-2) — avoids mobile overflow
2. **No API route for sync-logs**: Server component with direct queries (Gap 13) — follows existing pattern
3. **Expandable errors**: HTML `<details>/<summary>` elements (Gap 14) — progressive enhancement, zero JS overhead
4. **Club_id stale after transfer**: Show player's current club in UI, not mapping's club_id (Gap 6) — avoids misleading data
5. **mapped_by auto-populate**: Set in server action from admin's userId (Gap 7) — preserves audit trail
6. **Team name case sensitivity**: Store as-is, document for sync.ts (Gap 8) — not a Session 2 concern
7. **Multiple team names per club**: Schema already supports it (Gap 9) — no change needed
8. **Bulk CSV import**: Deferred (design spec mentions it) — only 3 clubs and 12 players right now

## File Inventory

### New Files (18)

| # | File | Purpose |
|---|------|---------|
| | **Migration** | |
| 1 | `supabase/migrations/20250101000042_camera_admin_indexes.sql` | 3 composite indexes for admin queries (Performance Oracle) |
| | **Pages** | |
| 2 | `src/app/platform/camera/layout.tsx` | Sub-tab navigation (client component for usePathname) |
| 3 | `src/app/platform/camera/page.tsx` | Redirect to /mappings |
| 4 | `src/app/platform/camera/mappings/page.tsx` | Player mapping list |
| 5 | `src/app/platform/camera/mappings/new/page.tsx` | Add player mapping form page |
| 6 | `src/app/platform/camera/mappings/[id]/edit/page.tsx` | Edit player mapping form page |
| 7 | `src/app/platform/camera/mappings/loading.tsx` | Skeleton |
| 8 | `src/app/platform/camera/clubs/page.tsx` | Club mapping list |
| 9 | `src/app/platform/camera/clubs/new/page.tsx` | Add club mapping form page |
| 10 | `src/app/platform/camera/clubs/[id]/edit/page.tsx` | Edit club mapping form page |
| 11 | `src/app/platform/camera/clubs/loading.tsx` | Skeleton |
| 12 | `src/app/platform/camera/sync/page.tsx` | Sync dashboard (server + client hybrid) |
| 13 | `src/app/platform/camera/sync/loading.tsx` | Skeleton |
| | **Components** | |
| 14 | `src/components/platform/PlayerMappingForm.tsx` | Create/edit player mapping (client, reuses PlayerSearchSelect) |
| 15 | `src/components/platform/ClubMappingForm.tsx` | Create/edit club mapping (client) |
| 16 | `src/components/platform/SyncTrigger.tsx` | File upload + sync trigger (client) |
| 17 | `src/components/platform/SyncLogTable.tsx` | Expandable sync log table (client for details/summary accordion) |
| | **Server actions** | |
| 18 | `src/app/actions/platform-camera.ts` | CRUD for player/club mappings (discriminated union returns) |

### Modified Files (3)

| # | File | Change |
|---|------|--------|
| 1 | `src/components/platform/PlatformSidebar.tsx` | Add Camera link |
| 2 | `src/lib/translations/admin.ts` | Add ~35 camera translation keys (en + ka) — reduced from ~45 by deferring filter/unmapped keys |
| 3 | `src/lib/validations.ts` | Add playerMappingSchema + clubMappingSchema (with int4 max, trim, regex hardening) |

### Auto-Generated (1)

| # | File | Change |
|---|------|--------|
| 1 | `src/lib/database.types.ts` | Regenerated after index migration |

### Deferred (build when needed)

| What | Why | When |
|------|-----|------|
| Unmapped players section on mappings page | Zero syncs exist, no data to show | After first real Starlive syncs |
| Club filter on player mappings | 3 clubs, <20 mappings | When mappings exceed 50+ |
| Status filter on sync logs | <100 logs for months | When logs exceed ~200 |
| Bulk CSV import for mappings | Only 3 clubs, 12 players | When onboarding 10+ clubs |

**Total: 18 new + 3 modified + 1 auto-generated = 22 files**

## Commit Strategy

Recommended 5 commits:

1. `feat(db): add camera admin composite indexes` — migration 000042 with 3 indexes
2. `feat(camera): add platform sidebar link and camera sub-tab layout` — sidebar update + layout.tsx + page.tsx redirect + validations
3. `feat(camera): add club mapping admin pages` — ClubMappingForm + club pages + server actions (club part) + loading skeleton
4. `feat(camera): add player mapping admin pages` — PlayerMappingForm (reuses PlayerSearchSelect) + player pages + server actions (player part) + loading skeleton
5. `feat(camera): add sync dashboard with log viewer` — SyncTrigger + SyncLogTable + sync page + loading skeleton + all translation keys

## Session 3+ Preview (Not in Scope)

- **Session 3:** Player profile camera stats (CameraStats, PerformanceRadar, TrendChart, Heatmap)
- **Session 4:** Match page full report (MatchReport, ShotMap, AttackDirection, StatsTimeline)
- **Session 5:** Comparison tool update + polish (camera indexes, side-by-side heatmaps)

## Sources & References

### Origin

- **Design spec:** [docs/superpowers/specs/2026-03-19-starlive-camera-integration-design.md](../superpowers/specs/2026-03-19-starlive-camera-integration-design.md) — Section 4e (Platform Admin Camera Management)
- **Session 1 plan:** [docs/plans/2026-03-19-feat-camera-integration-session-1-database-backend-core-plan.md](./2026-03-19-feat-camera-integration-session-1-database-backend-core-plan.md) — database schema + sync backend

### Internal References

- Platform admin layout: `src/app/platform/layout.tsx` — auth guard pattern
- Club CRUD reference: `src/app/platform/clubs/` + `src/components/platform/ClubForm.tsx` + `src/app/actions/platform-clubs.ts`
- Platform sidebar: `src/components/platform/PlatformSidebar.tsx` — link array pattern
- Auth guard: `src/lib/auth.ts` → `getPlatformAdminContext()`
- Service role client: `src/lib/supabase/admin.ts` → `createAdminClient()`
- Sync service: `src/lib/camera/sync.ts` — syncPlayerData/syncMatchReport/syncHeatmap
- Sync API: `src/app/api/camera/sync/route.ts` — POST endpoint
- Validations: `src/lib/validations.ts` — existing Zod schemas
- Translations: `src/lib/translations/admin.ts` — platform namespace
