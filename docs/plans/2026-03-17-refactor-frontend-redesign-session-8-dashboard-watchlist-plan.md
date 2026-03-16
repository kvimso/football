---
title: "refactor: Frontend Redesign Session 8 — Dashboard + Watchlist"
type: refactor
status: completed
date: 2026-03-17
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
---

# Session 8 — Dashboard + Watchlist Workspace Redesign

## Enhancement Summary

**Deepened on:** 2026-03-17
**Sections enhanced:** 8
**Review agents used:** code-simplicity-reviewer, architecture-strategist, performance-oracle, kieran-typescript-reviewer, julik-frontend-races-reviewer, security-sentinel, pattern-recognition-specialist, best-practices-researcher
**Learnings applied:** shortlist-to-watchlist-migration, warm-dark-gold-theme-redesign, chat-system-polish-i18n-mobile-realtime

### Key Improvements

1. **Discriminated union for ActivityItem** — TypeScript reviewer: replace flat nullable interface with proper discriminated union for compile-time safety
2. **AdminSidebar pattern reuse** — DashboardSidebar must mirror `AdminSidebar.tsx` structure (icon SVG paths array, usePathname, realtime subscription, desktop sidebar + mobile tabs)
3. **Realtime unread migration** — Chat polish learning: the realtime Supabase channel subscription from `DashboardNav.tsx` must be migrated into `DashboardSidebar.tsx` (initial RPC + `postgres_changes` + 500ms debounce + cleanup)
4. **Inline watchlist query limit** — Performance reviewer: don't fetch 100+ items for an 8-entry panel; add `.limit(8)` to server query or fetch only recent 20
5. **Tag pills use `bg-elevated`** — Theme redesign learning: `bg-surface` pills on `bg-surface` cards are invisible; escalate to `bg-elevated`
6. **Notification badges use `bg-pos-X-bg` tokens** — Theme learning: use explicit background tokens, not opacity-based `bg-current/10`
7. **Layout queries cached on soft nav** — Architecture reviewer: `layout.tsx` doesn't re-execute on client navigation, so count queries only fire on initial/hard page load (acceptable)
8. **Activity feed Step A optimization** — Architecture reviewer: run watchlist player_id fetch in first `Promise.all` alongside other 3 queries, then Step B as follow-up
9. **`dvh` not `vh`** — Chat polish learning: use `100dvh` for full-height containers (mobile browser chrome safe)
10. **Preserve `e.preventDefault()` pattern** — Watchlist migration learning: click handlers inside `<Link>` in WatchlistPlayerRow must keep `e.preventDefault()` + `e.stopPropagation()`
11. **Sidebar counts fetched client-side, NOT in layout.tsx** — Races + Pattern reviewers AGREE: layout.tsx doesn't re-execute on soft navigation, so server-passed counts go permanently stale. DashboardSidebar must fetch its own counts client-side (matching AdminSidebar pattern exactly)
12. **Sidebar width `w-56` not 200px** — Pattern reviewer: AdminSidebar and PlatformSidebar both use `w-56` (224px). Use same for consistency.
13. **`viewport-fit=cover` required** — Best-practices researcher: without this meta tag, `env(safe-area-inset-bottom)` returns 0 on iOS. Verify it exists in root layout metadata.
14. **Activity feed error handling** — Architecture + Pattern reviewers: each of the 4 activity feed queries must have explicit `.error` checks. If one source fails, render the feed with whatever succeeded (graceful degradation).
15. **Check `auth.getUser()` for `last_sign_in_at`** — Pattern reviewer: Supabase Auth's `getUser()` may already return `last_sign_in_at` on the user object, eliminating the need for admin client entirely.

### Scope Adjustments

1. **StatSummary inlined** — Simplicity reviewer: stat summary is 3 numbers in a row, doesn't warrant its own component file. Inline into `DashboardHome.tsx` welcome section.
2. **Admin client scope** — Architecture reviewer: when reading `last_sign_in_at`, query only that single field from `auth.users` via `admin.auth.admin.getUserById()` — don't use raw SQL on auth.users table.
3. **Watchlist panel server query** — Performance reviewer: add `.limit(20)` to the panel's server query (not the full watchlist page query). Client-side filtering of 20 items for 8-entry display is acceptable.

---

## Overview

Transform the scout dashboard from a static stat-card page into a living workspace — activity feed, inline watchlist panel, slim left sidebar, and stat summary bar. The watchlist, notifications, and related components get an A3 restyle. This is the "makes the platform feel alive" session.

**Scope from design spec (Session 8):** "Dashboard + Watchlist — Activity feed, watchlist with folders/tags, notifications foundation."

**Design moment:** Moment 5: Workspace — "This feels like MY space."

## Problem Statement

The current dashboard is a 3-card stat grid (Watchlist count, Messages count, Compare link) with a recent notifications list and quick action buttons. It's functional but static — a scout opens it, sees numbers, and immediately navigates away. There's no reason to linger. The horizontal `DashboardNav` tabs waste vertical space and feel disconnected from the workspace concept.

The watchlist, notifications, and dashboard components still use old color tokens and patterns that need updating to the A3 palette established in Sessions 1-6.

## Proposed Solution

### Files Modified (A3 restyle — no functional changes)

| File | Change |
|------|--------|
| `src/components/dashboard/WatchlistPage.tsx` | Token updates (bg, border, text colors) |
| `src/components/dashboard/WatchlistPlayerRow.tsx` | Token updates, position badge via `bg-pos-X-bg text-pos-X` |
| `src/components/dashboard/WatchlistSidebar.tsx` | Token updates |
| `src/components/dashboard/NotificationList.tsx` | Token updates, type icons use semantic colors |
| `src/components/dashboard/RequestsList.tsx` | Token updates (legacy, kept as-is) |
| `src/app/dashboard/loading.tsx` | Match new layout |
| `src/app/dashboard/watchlist/loading.tsx` | Token updates |
| `src/app/dashboard/notifications/loading.tsx` | Token updates |

### Files Modified (functional changes)

| File | Change |
|------|--------|
| `src/app/dashboard/layout.tsx` | Replace `DashboardNav` with `DashboardSidebar`, sidebar + content grid |
| `src/app/dashboard/page.tsx` | Add activity feed queries, inline watchlist data, stat summary, last login |
| `src/components/dashboard/DashboardHome.tsx` | Complete rewrite — 60/40 split with activity feed + inline watchlist panel + stat summary |
| `src/components/dashboard/DashboardNav.tsx` | Replaced by `DashboardSidebar` — delete this file |
| `src/lib/translations/admin.ts` | New keys for activity feed items, sidebar labels, stat summary |

### New Files

| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardSidebar.tsx` | `w-56` left sidebar (Dashboard, Watchlist, Messages, Compare) + mobile bottom tab bar + client-side realtime unread count |
| `src/components/dashboard/ActivityFeed.tsx` | Client component rendering the activity feed list |
| `src/components/dashboard/WatchlistPanel.tsx` | Compact inline watchlist for dashboard (recent entries, 8-entry limit, "View all" link) |

> **Note:** `StatSummary.tsx` removed per simplicity review — stat summary inlined directly in `DashboardHome.tsx`.

### Files NOT changed (0 new routes, 0 DB migrations)

- No route structure changes — all routes remain under `/dashboard/*`
- No database migrations — activity feed is assembled from existing tables at query time
- No new API routes — all data fetched server-side

---

## Technical Approach

### 1. Dashboard Layout Restructure (`layout.tsx`)

**Current:** `Navbar` → `DashboardNav` (horizontal tabs) → `{children}` → `Footer`

**New:** `Navbar` → sidebar + content grid → `Footer`

```
┌──────────────────────────────────────────────┐
│ Navbar (48px, shared)                        │
├────────┬─────────────────────────────────────┤
│ Sidebar│  Content ({children})               │
│ 200px  │                                     │
│        │                                     │
│ Dashboard                                    │
│ Watchlist (12)                               │
│ Messages ●                                   │
│ ─────────                                    │
│ Compare                                      │
├────────┴─────────────────────────────────────┤
│ Footer                                       │
└──────────────────────────────────────────────┘
```

**Responsive behavior:**
- `md:` (768px+): `w-56` sidebar with labels + content (matches AdminSidebar two-tier pattern)
- `<md:` (mobile): No sidebar, bottom tab bar (56px) pinned to viewport bottom

> **Research Insight (Pattern):** AdminSidebar uses a simple two-tier pattern (sidebar at md+, tabs at <md). The original plan had a three-tier approach with icon-only tablet mode — this is cut to match the established pattern and reduce complexity.

**Implementation in `layout.tsx`:**
```tsx
// Replace DashboardNav import with DashboardSidebar
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

// Layout grid — sidebar fetches its own counts client-side (no server props needed)
<div className="mx-auto flex min-h-[calc(100dvh-var(--navbar-height))] max-w-7xl">
  <DashboardSidebar />
  <main className="flex-1 min-w-0 px-4 pt-8 pb-20 md:pb-8">
    {children}
  </main>
</div>
<Footer />
```

Note: `pb-20` on mobile creates space for the 56px bottom tab bar. `md:pb-8` restores normal padding on tablet+. `<Footer />` must be included (matches admin/platform layout pattern).

**Data for sidebar:** Layout stays lean (auth check only). Do NOT add count queries to layout.tsx.

> **Research Insight (Races + Pattern + Architecture — ALL AGREE):** In Next.js App Router, `layout.tsx` does **not** re-execute on soft navigation between child routes. If you pass counts as server props from layout, they go permanently stale — a scout could receive 5 messages and the sidebar would still show 0 until a hard page refresh. This is the #1 risk in the plan.
>
> **Correct approach (matches AdminSidebar pattern):** `DashboardSidebar` is a client component that fetches its own counts client-side via `useEffect` + Supabase RPC + Realtime subscription. No count queries in layout.tsx. The sidebar is self-contained — exactly how `AdminSidebar.tsx` (lines 52-85) works today.
>
> **Sequence:** Sidebar mounts → initial `supabase.rpc('get_total_unread_count')` → subscribe to `postgres_changes` on messages table → 500ms debounced re-fetch on any change → cleanup on unmount. Watchlist count: initial fetch on mount, refresh on `pathname` change (simpler than Realtime since watchlist changes less frequently).

> **Research Insight (Chat Polish Learning):** Use `100dvh` not `100vh` for `min-h-[calc(...)]` — `dvh` accounts for mobile browser chrome (Safari address bar). The plan already uses `100dvh` correctly.

### 2. DashboardSidebar Component

**Desktop (lg:):** Slim `w-56` (224px) sidebar, left-aligned (matches AdminSidebar and PlatformSidebar)
```
Dashboard
Watchlist (12)
Messages  ●
───────────
Compare →
```

- Active link: `bg-primary/10 text-primary font-medium` with left border accent (3px `bg-primary`)
- Inactive: `text-foreground-muted hover:text-foreground hover:bg-elevated`
- Divider between main nav and utility links
- "Compare" links to `/players/compare` (exits dashboard layout — acceptable since it opens in same tab and the user can navigate back)
- **No "Settings" link** — deferred (no settings page exists, and stubbing it adds no value)

> **Research Insight (Pattern Recognition):** Follow `AdminSidebar.tsx` structure exactly:
> - Links array with `href`, `labelKey`, `icon` (SVG path string), `showUnread?` flag
> - `usePathname()` + `useAuth()` for active state detection
> - Realtime unread subscription: initial `supabase.rpc('get_total_unread_count')` + `postgres_changes` on `messages` table + 500ms debounce + `removeChannel` cleanup
> - Unique channel name: `'dashboard-sidebar-unread'` (not reuse admin's channel name)
> - Desktop sidebar in `<aside>` with `sticky top-[calc(var(--navbar-height)+2rem)]`

> **Research Insight (Chat Polish Learning):** When deleting `DashboardNav.tsx`, **migrate its realtime unread subscription** into `DashboardSidebar.tsx`. Without this, the live unread indicator silently disappears. The exact pattern: initial RPC fetch → `supabase.channel('dashboard-sidebar-unread').on('postgres_changes', ...)` → 500ms debounce timer → cleanup in useEffect return.

**Mobile (<md:):** Fixed bottom tab bar
```
┌──────────────────────────────────┐
│  🏠 Home  │  ⭐ Watchlist  │  💬 Messages │
└──────────────────────────────────┘
```
- 3 tabs only (Home = Dashboard, Watchlist, Messages)
- Compare accessed via player profile's compare button
- Fixed positioning: `fixed bottom-0 inset-x-0 h-14 bg-surface border-t border-border z-40`
- Active tab: `text-primary`, inactive: `text-foreground-muted`
- Add `pb-[env(safe-area-inset-bottom)]` for iOS notch/home-bar safe area

> **Research Insight (Best Practices):** For the fixed bottom tab bar on mobile:
> - Use `env(safe-area-inset-bottom)` for iOS safe areas (devices with home bar)
> - Ensure `z-40` is above content but below modals/popovers (`z-50+`)
> - The Navbar hamburger menu and bottom tabs coexist — this is the Instagram/Discord pattern (top bar for platform nav, bottom tabs for section nav)
> - `AdminSidebar.tsx` uses a horizontal scrollable tab bar on mobile instead of fixed bottom tabs — the DashboardSidebar intentionally differs here per the design spec

### 3. DashboardHome Rewrite (60/40 Split)

**Current `DashboardHome`:** 3 stat cards + notifications + quick links
**New `DashboardHome`:** Welcome header + stat summary + 60/40 activity-feed/watchlist split

#### Welcome Header
```
Welcome back, Levani
Last active 2 hours ago
```

- `fullName` from `profiles.full_name` (already fetched)
- "Last active" from Supabase Auth `last_sign_in_at` — fetched server-side via admin client in `page.tsx`
- Uses `timeAgo()` utility (already exists in `src/lib/utils.ts`)
- If `last_sign_in_at` is null or is the current session (same day), show "Welcome, {name}" without the "last active" line

> **Research Insight (Architecture/Security):** Use `admin.auth.admin.getUserById(user.id)` to read `last_sign_in_at`. This returns a typed `User` object with `last_sign_in_at: string | null`. Do NOT use raw SQL on `auth.users` — the admin `getUserById` method is the sanctioned way to read auth metadata. The service role client is already established in `src/lib/supabase/admin.ts` and used in platform admin routes.

#### Stat Summary Bar (inlined in `DashboardHome.tsx`)
Horizontal bar below welcome header:
```
12 players watched  |  3 unread messages  |  47 profiles viewed this week
```

- 3 stats, pipe-separated, compact text
- Numbers in `font-semibold text-foreground`, labels in `text-foreground-muted text-sm`
- Data: `watchlistCount`, `unreadCount`, `weeklyViewCount`
- `weeklyViewCount` = new query: `player_views` where `viewer_id = user.id` and `viewed_at >= 7 days ago`, count only

> **Research Insight (Simplicity):** This is 3 numbers in a `<div className="flex gap-4">`. Doesn't warrant a separate `StatSummary.tsx` component file. Inline directly in `DashboardHome.tsx` within the welcome header section. **Remove `StatSummary.tsx` from new files list.**

#### Activity Feed (60% left column)

**Data assembly in `page.tsx` (server component):**

4 parallel Supabase queries:

1. **Player views** (scout's own):
   ```
   player_views
     .select('viewed_at, player:players(name, name_ka, slug)')
     .eq('viewer_id', user.id)
     .order('viewed_at', { ascending: false })
     .limit(10)
   ```
   - Deduplicate: group by `player_id`, keep most recent `viewed_at` per player (done in TypeScript after fetch)

2. **Watchlist additions** (scout's own):
   ```
   watchlist
     .select('created_at, player:players(name, name_ka, slug)')
     .eq('user_id', user.id)
     .order('created_at', { ascending: false })
     .limit(10)
   ```

3. **Recent messages** (unread):
   ```
   messages
     .select('created_at, conversation:conversations(academy_club:clubs(name, name_ka))')
     .eq('receiver_id', user.id)
     .eq('is_read', false)
     .order('created_at', { ascending: false })
     .limit(10)
   ```

4. **Watched player updates** (players in watchlist that were recently updated):
   ```
   // Step A: Get watchlist player IDs
   watchlist.select('player_id').eq('user_id', user.id)

   // Step B: Get recently updated players from that list
   players
     .select('updated_at, name, name_ka, slug')
     .in('id', playerIds)
     .gt('updated_at', '7 days ago')
     .order('updated_at', { ascending: false })
     .limit(10)
   ```
   - Note: This is 2 queries, but the first is lightweight (IDs only). Run Step A first, then Step B.

**Normalization into `ActivityItem[]` (discriminated union):**

> **Research Insight (TypeScript Reviewer):** Use a discriminated union instead of a flat interface with nullable fields. The flat approach allows accessing `conversationId` on a `'view'` item and getting `null` at runtime with no compile-time warning. The discriminated union lets the compiler enforce exhaustive handling in switch/case and makes `playerSlug` non-nullable on view items.

```ts
interface ActivityItemBase {
  timestamp: string
}

interface ViewActivity extends ActivityItemBase {
  type: 'view'
  playerName: string
  playerSlug: string
}

interface WatchlistAddActivity extends ActivityItemBase {
  type: 'watchlist_add'
  playerName: string
  playerSlug: string
}

interface MessageActivity extends ActivityItemBase {
  type: 'message'
  academyName: string
  conversationId: string
}

interface PlayerUpdateActivity extends ActivityItemBase {
  type: 'player_update'
  playerName: string
  playerSlug: string
}

type ActivityItem =
  | ViewActivity
  | WatchlistAddActivity
  | MessageActivity
  | PlayerUpdateActivity
```

> **Research Insight (Architecture):** For the watched-player-updates query (Step A + Step B), run Step A (`watchlist.select('player_id')`) in the first `Promise.all` alongside the other 3 queries. Then run Step B (`.in('id', playerIds)`) as a follow-up. This saves one round-trip vs running Steps A+B sequentially after the other queries.

**Merge:** Combine all 4 arrays, sort by `timestamp` descending, take first 20.

**Feed rendering (`ActivityFeed.tsx`):**
Each item is a compact row:
```
[Icon]  You viewed Giorgi Kvilitaia's profile           2h ago
[Icon]  You added Luka Zarandia to your watchlist       1d ago
[Icon]  New message from Torpedo Kutaisi               3d ago
[Icon]  Mamardashvili's profile was updated             5d ago
```

- Left: type icon (eye for view, star for watchlist, message for chat, refresh for update)
- Center: description text with player/academy name as link
- Right: relative timestamp via `timeAgo()`
- Row is clickable: views → player profile, watchlist → player profile, messages → conversation, updates → player profile
- Unread messages get `bg-primary/5` highlight
- Empty state: "No recent activity. Start by browsing players." with link to `/players`

#### Inline Watchlist Panel (40% right column, `WatchlistPanel.tsx`)

Compact version of the full watchlist, showing in the dashboard's right column:

**Folder tabs (horizontal):**
```
All (12)  |  Midfielders (5)  |  U-17 Targets (3)
```
- Horizontal scrollable tab bar
- Active folder: green underline, `text-primary font-medium`
- Inactive: `text-foreground-muted`
- No "New Folder" button (use full watchlist page for folder management)

**Player entries (compact rows, not cards):**
- 32px rounded-square photo (`rounded-md`, not circular)
- Name + position badge (inline)
- Age
- Truncated note (1 line, `truncate`)
- Compare button (icon-only, navigates to `/players/compare?p1=slug`)
- Remove button (icon-only)
- Tags as small pills below name (max 3, "+N more" for overflow)

**Limit:** Show latest 8 entries per active folder. If more exist, show "View all (N) →" link to `/dashboard/watchlist?folder=X`.

**Scrollable container:** `max-h-[60vh] overflow-y-auto` with themed scrollbar.

**Empty state:** "No players in your watchlist. Browse players to get started." with link.

**Data:** Separate lighter server query from the full watchlist page — add `.limit(20)` to the panel's watchlist query and skip tags/folder-assignments unless folder tabs are implemented. The inline panel filters/limits client-side from this 20-item set.

> **Research Insight (Performance):** Don't reuse the full watchlist page query (which fetches all items + all tags + all folder assignments). For a scout with 100+ watched players, this sends unnecessary data. Instead, use a simpler query:
> ```
> watchlist
>   .select('id, player_id, notes, created_at, player:players!watchlist_player_id_fkey(id, name, name_ka, slug, position, date_of_birth, photo_url, club:clubs!players_club_id_fkey(name, name_ka))')
>   .eq('user_id', user.id)
>   .order('created_at', { ascending: false })
>   .limit(20)
> ```
> Folder assignments and tags can be fetched lazily only if the panel needs folder tabs. For MVP, the panel shows "Recent" only (no folder tabs), keeping the query simple.

> **Research Insight (Simplicity):** The simplicity reviewer recommended cutting folder tabs from the inline panel entirely — the full watchlist page already has comprehensive folder management. The panel should focus on showing the scout's most recent watchlist additions with a "View all" link. This removes one data fetch and simplifies the component.

**Mobile:** Hidden entirely on `<md:`. Scout uses bottom tab bar → Watchlist.

**Desktop layout:**
```tsx
<div className="mt-6 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
  <ActivityFeed items={activityItems} />
  <div className="hidden md:block">
    <WatchlistPanel items={watchlistItems} folders={folders} ... />
  </div>
</div>
```

### 4. A3 Restyle (Watchlist + Notifications)

Watchlist and notification components are feature-complete. Only color token updates needed.

**Token migration pattern (applies to all restyled files):**

| Old | New |
|-----|-----|
| `bg-background` | Already correct (maps to `var(--background)`) |
| `bg-surface` | Already correct |
| `border-border` | Already correct |
| `text-foreground` | Already correct |
| `text-foreground-muted` | Already correct |
| `bg-primary/10` | Already correct |
| `text-primary` | Already correct |
| Hardcoded `text-green-700` | `text-primary` |
| Hardcoded `text-cyan-700`, etc. | Position/semantic tokens |
| `bg-current/10` | `bg-primary-muted` or position-specific `bg-pos-X-bg` |
| `hover:bg-surface` (on elements already `bg-surface`) | `hover:bg-elevated` |

**Specific restyle notes:**

- **`NotificationList.tsx`**: The `TYPE_ICONS` color map uses hardcoded Tailwind colors (`text-green-700`, `text-cyan-700`, `text-amber-700`, `text-red-600`, `text-blue-700`). Replace with semantic tokens:
  - `goal` → `text-primary` (green, matches success)
  - `assist` → `text-pos-wng` (cyan)
  - `club_change` → `text-pos-gk` (gold/amber)
  - `free_agent` → `text-foreground-muted`
  - `new_video` → `text-danger` (red)
  - `announcement` → `text-pos-st` (blue)
  - The inline badge `bg-current/10` pattern → use dedicated `bg-primary-muted` / `bg-pos-X-bg` per type

- **`WatchlistPlayerRow.tsx`**: The `.card` class already uses A3 tokens. Check that `hover:text-red-600` on remove button uses `hover:text-danger` instead. Tag pills use `bg-surface` — **must change to `bg-elevated`** (see insight below). Preserve `e.preventDefault()` + `e.stopPropagation()` on click handlers inside `<Link>` (watchlist migration learning).

  > **Research Insight (Theme Redesign Learning):** Tag pills using `bg-surface` sitting inside a card that is also `bg-surface` are invisible in both themes. The correct fix: `bg-elevated` — one step up from `bg-surface`:
  > - Light: card `#F4F1EC` → pill `#EAE6DF` (slightly darker, visible)
  > - Dark: card `#1C1A17` → pill `#2A2623` (slightly lighter, visible)
  > This follows the principle: "Never pair two independently-varying semantic variables for fg/bg without a dedicated contrast variable."

- **`WatchlistSidebar.tsx`**: Active folder `bg-primary/10 text-primary` is correct. Ensure create button uses `text-primary` not hardcoded green.

- **`NotificationList.tsx` badge backgrounds**: Replace `bg-current/10` with dedicated tokens per type:

  > **Research Insight (Theme Redesign Learning):** Use explicit `bg-pos-X-bg` tokens instead of opacity-based `bg-current/10`. The opacity approach creates rendering inconsistency on different surface backgrounds. The A3 token system already solves this:
  > - `goal` → `bg-primary-muted text-primary`
  > - `assist` → `bg-pos-wng-bg text-pos-wng`
  > - `club_change` → `bg-pos-gk-bg text-pos-gk`
  > - `free_agent` → `bg-elevated text-foreground-muted`
  > - `new_video` → `bg-danger-muted text-danger`
  > - `announcement` → `bg-pos-st-bg text-pos-st`

### 5. Loading Skeleton Updates

**`dashboard/loading.tsx`** — Must match new 60/40 layout:
```
┌──────────────┬──────────┐
│ Welcome (h7) │          │
│ Stat bar     │          │
├──────────────┤ Watchlist │
│ Feed item    │ panel    │
│ Feed item    │ skeleton │
│ Feed item    │          │
│ ...          │          │
└──────────────┴──────────┘
```

**`watchlist/loading.tsx`** — Already good, minor token check.
**`notifications/loading.tsx`** — Already good, minor token check.

### 6. i18n — New Translation Keys

Add to `src/lib/translations/admin.ts`:

**Activity feed:**
- `dashboard.lastActive` → "Last active {time}" / "ბოლო აქტივობა {time}"
- `dashboard.activityFeed` → "Recent Activity" / "ბოლო აქტივობა"
- `dashboard.viewedProfile` → "You viewed {name}'s profile" / "თქვენ ნახეთ {name}-ის პროფილი"
- `dashboard.addedToWatchlist` → "You added {name} to your watchlist" / "თქვენ დაამატეთ {name} თქვენს სიაში"
- `dashboard.newMessageFrom` → "New message from {name}" / "ახალი შეტყობინება {name}-ისგან"
- `dashboard.profileUpdated` → "{name}'s profile was updated" / "{name}-ის პროფილი განახლდა"
- `dashboard.noActivity` → "No recent activity" / "ბოლო აქტივობა არ არის"
- `dashboard.noActivityHint` → "Start by browsing players" / "დაიწყეთ მოთამაშეების დათვალიერებით"

**Stat summary:**
- `dashboard.playersWatched` → "players watched" / "მოთამაშე ნანახი"
- `dashboard.unreadMessages` → "unread messages" / "წაუკითხავი შეტყობინება"
- `dashboard.profilesViewed` → "profiles viewed this week" / "პროფილი ნანახი ამ კვირაში"

**Sidebar:**
- `dashboard.home` → "Home" / "მთავარი"

**Watchlist panel:**
- `dashboard.viewAll` → "View all" / "ყველას ნახვა"
- `dashboard.comparePlayer` → "Compare" / "შედარება"

---

## Execution Order

### Step 1: DashboardSidebar + Layout (Foundation)

1. Create `DashboardSidebar.tsx` — mirror `AdminSidebar.tsx` structure exactly (links array with SVG paths, usePathname, `w-56` sidebar at md+, bottom tabs at <md, realtime unread subscription with unique channel `'dashboard-sidebar-unread'`, client-side watchlist count fetch)
2. Update `dashboard/layout.tsx` — replace `DashboardNav` with sidebar grid layout using `100dvh`, add `<Footer />`, keep layout lean (auth check only, NO count queries)
3. Delete `DashboardNav.tsx` — **ensure realtime unread subscription is migrated to DashboardSidebar first**
4. Verify `viewport-fit=cover` in root layout metadata (required for `env(safe-area-inset-bottom)`)
5. Add `pb-[env(safe-area-inset-bottom)]` to bottom tab bar for iOS safe area
6. Update `dashboard/loading.tsx` — match new layout (sidebar is NOT in skeleton since it's in layout)
7. **Verify:** All dashboard child routes render correctly with new layout, unread indicator updates live when messages arrive

### Step 2: Stat Summary + Activity Feed

1. Add new i18n keys to `admin.ts` (both en and ka)
2. Add activity feed queries to `dashboard/page.tsx` — run watchlist player_id fetch (Step A) in first `Promise.all` alongside other 3 queries, then Step B as follow-up
3. Add weekly view count query for stat summary (inline in page.tsx)
4. Add `last_sign_in_at` fetch via `admin.auth.admin.getUserById(user.id)` — type is `string | null`
5. Create `ActivityFeed.tsx` component with discriminated union `ActivityItem` type
6. **Verify:** Dashboard shows welcome header, stat summary, and populated activity feed

### Step 3: Inline Watchlist Panel

1. Create `WatchlistPanel.tsx` — recent entries (no folder tabs), 8-entry limit, compact player rows
2. Add limited watchlist query to `dashboard/page.tsx` — `.limit(20)`, no tags/folder joins
3. Wire into `DashboardHome.tsx` as 60/40 grid right column
4. Hidden on `<md:` breakpoint
5. **Verify:** Watchlist panel shows, "View all" links to full watchlist page correctly

### Step 4: DashboardHome Rewrite

1. Rewrite `DashboardHome.tsx` — welcome header + stat summary + 60/40 feed/watchlist grid
2. Replace old stat cards and quick links
3. Keep notification list integration (still shown below the main content? Or fully replaced by activity feed?)
   - **Decision:** Remove the notification preview from DashboardHome. Notifications are accessible via Navbar bell. The activity feed replaces the "recent notifications" section.
4. **Verify:** Full dashboard flow — header → stats → feed → watchlist panel

### Step 5: A3 Restyle + Polish

1. Restyle `WatchlistPage.tsx` — token updates
2. Restyle `WatchlistPlayerRow.tsx` — tag pills `bg-surface` → `bg-elevated`, `hover:text-red-600` → `hover:text-danger`, preserve `e.preventDefault()` + `e.stopPropagation()` on handlers inside `<Link>`
3. Restyle `WatchlistSidebar.tsx` — token updates
4. Restyle `NotificationList.tsx` — replace hardcoded Tailwind colors with semantic tokens, `bg-current/10` → `bg-pos-X-bg` per type
5. Update loading skeletons for watchlist and notifications
6. **Verify:** Both light and dark mode, both languages, mobile at 375px

### Step 6: Build + Verification

1. `npm run build` — must pass
2. Visual verification both themes via Playwright
3. Mobile check at 375px
4. Both languages (en/ka) verified
5. Activity feed with empty state (new scout)
6. Activity feed with data (existing scout)

---

## Scope Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Activity feed granularity | Generic "profile updated" (no field-level detail) | No changelog table exists; adding one is a Phase 8+ concern |
| View deduplication | Collapse same-player views within 24h, show most recent | Matches existing 1-hour dedup in `trackPlayerView` |
| Compare sidebar link | Links to `/players/compare` (exits dashboard layout) | Acceptable UX; adding `/dashboard/compare` duplicates components |
| Settings page | Not included | No settings exist in the codebase; stubbing adds no value |
| Requests page | Left as-is (no removal) | Dead route, low priority cleanup |
| Last login source | `last_sign_in_at` from Supabase Auth via admin client | Zero migration, simple server-side fetch |
| Mobile watchlist panel | Hidden; use bottom tab → Watchlist page | Stacking 60/40 vertically produces very long scroll |
| Inline watchlist limit | 8 entries + "View all" link | Keeps panel height manageable in 40% column |
| Notification preview | Removed from DashboardHome | Activity feed replaces it; bell in Navbar provides access |
| Tablet sidebar | Full sidebar at md+ (same as desktop) | Matches AdminSidebar two-tier pattern; icon-only tier cut per simplicity + pattern reviewers |
| "This week" definition | Rolling 7-day window from now | Simpler than calendar-week calculation |
| Notifications page sidebar | Not in sidebar (accessible via Navbar bell → "View all") | Matches design spec sidebar list which omits Notifications |
| Inline watchlist folder tabs | Removed — show "Recent" only | Full folder management exists on dedicated watchlist page; folder tabs in a 40% panel add complexity for minimal value (simplicity + performance reviewers agreed) |
| StatSummary component | Inlined into DashboardHome.tsx | 3 numbers in a flex row doesn't warrant its own file (simplicity reviewer) |
| Admin client for last_sign_in_at | Use `admin.auth.admin.getUserById()` | Returns typed User object; don't query raw auth.users table (architecture/security reviewers) |

---

## Acceptance Criteria

### Functional

- [x] Slim left sidebar renders on all `/dashboard/*` routes with correct active state
- [x] Sidebar shows watchlist count and unread message indicator (green dot)
- [x] Sidebar shows at md+ (768px+) with full labels (matching AdminSidebar)
- [x] Bottom tab bar appears on mobile (<768px) with Home, Watchlist, Messages
- [x] Bottom tab bar has correct active state based on current route
- [x] Welcome header shows scout's full name
- [x] Welcome header shows "last active" timestamp when available
- [x] Stat summary shows: players watched, unread messages, profiles viewed this week
- [x] Activity feed shows up to 20 items merged from 4 data sources
- [x] Activity feed items are clickable and link to correct destinations
- [x] Activity feed shows correct empty state for new scouts
- [x] Inline watchlist panel shows on dashboard page (md+ only)
- [x] Inline watchlist panel has horizontal folder tabs
- [x] Inline watchlist panel shows max 8 entries per folder
- [x] Inline watchlist panel "View all" links to full watchlist page with correct folder param
- [x] Quick compare button on watchlist rows navigates to `/players/compare?p1=slug`
- [x] Realtime unread indicator updates live when new messages arrive (migrated from DashboardNav)
- [x] Bottom tab bar respects iOS safe area (`env(safe-area-inset-bottom)`)
- [x] ActivityItem type uses discriminated union (no nullable fields on wrong variants)

### A3 Restyle

- [x] All dashboard components use A3 token names (no hardcoded Tailwind colors)
- [x] NotificationList type icons use semantic/position color tokens
- [x] WatchlistPlayerRow tag pills visible against card background in both themes
- [x] All hover states use `bg-elevated` (not same-bg hover)

### Quality

- [x] `npm run build` passes
- [x] Both light and dark mode visually correct
- [x] Both languages (en/ka) verified — all new strings translated
- [x] Mobile responsive at 375px — bottom tabs visible, no horizontal overflow
- [x] Loading skeletons match new layout structure
- [x] No regressions on Watchlist page, Notifications page, or Messages routes

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Activity feed 4-query assembly may be slow | All 4 queries are lightweight (limit 10 each, indexed columns). Run in parallel with `Promise.all`. Total should be <200ms. |
| `last_sign_in_at` requires admin client (service role) | Already used in other server components (e.g., platform admin). Pattern is established in `src/lib/supabase/admin.ts`. Only fetch once in `page.tsx`, pass as prop. |
| Sidebar + bottom tabs add nav complexity | Keep sidebar as a single component with responsive logic. Bottom tabs are a `<nav>` with `fixed` positioning — no state, just links. |
| Inline watchlist panel props overlap with full WatchlistPage | WatchlistPanel is a distinct component — not a prop-subset of WatchlistPage. It accepts pre-fetched data and renders compactly. No code sharing beyond types. |
| Mobile `pb-20` for bottom tabs on non-dashboard pages | The `pb-20 md:pb-8` is scoped to `dashboard/layout.tsx` children only. Other layouts unaffected. |
| Removing notification preview from DashboardHome | Navbar bell + `/dashboard/notifications` route remain. Scouts who relied on dashboard notifications will find them in the same bell dropdown they already use. |
| Deleting DashboardNav.tsx loses realtime unread subscription | Migrate the subscription pattern into DashboardSidebar before deletion. Use unique channel name `'dashboard-sidebar-unread'` to avoid conflicts with AdminSidebar's `'admin-sidebar-unread'`. |
| Stale activity feed timestamps | Feed items use `timeAgo()` rendered server-side. After 30 min on page, "2 min ago" is stale. Acceptable — dashboard refreshes on any navigation. Not worth adding client-side timestamp refresh for this session. |
| Watchlist junction table RLS | `watchlist_folder_players` uses subquery-based RLS (no direct `user_id`). If WatchlistPanel fetches folder-organized data, test RLS separately. For MVP (no folder tabs in panel), this risk is avoided. |

---

## Future Work (Out of Scope)

- Player changelog table for field-level activity feed detail
- Real-time activity feed updates via Supabase Realtime
- Dashboard settings page (notification preferences, theme, language)
- Watchlist import/export
- Activity feed filtering by type
- Drag-to-reorder watchlist entries (avoids library dependency per spec)
- `/dashboard/compare` wrapper route (to keep sidebar visible during comparison)

---

## Sources & References

### Design Spec
- `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` — Moment 5 (lines 368-400), Session 8 (line 474), Mobile Strategy (lines 438-446), Navigation (lines 284-316)

### Key Existing Files
- `src/app/dashboard/layout.tsx` — Current layout with DashboardNav
- `src/app/dashboard/page.tsx` — Server component with auth + parallel queries
- `src/components/dashboard/DashboardHome.tsx` — Current 3-card stat grid
- `src/components/dashboard/DashboardNav.tsx` — Horizontal tabs (to be replaced)
- `src/components/dashboard/WatchlistPage.tsx` — Full watchlist (feature-complete)
- `src/components/dashboard/WatchlistPlayerRow.tsx` — Watchlist row (feature-complete)
- `src/components/dashboard/WatchlistSidebar.tsx` — Folder/tag sidebar (feature-complete)
- `src/components/dashboard/NotificationList.tsx` — Notifications (feature-complete)
- `src/lib/notifications/types.ts` — Notification type definitions
- `src/lib/translations/admin.ts` — Dashboard + notification translations
- `src/app/actions/watchlist.ts` — Watchlist server actions
- `src/app/actions/watchlist-folders.ts` — Folder server actions
- `src/app/actions/watchlist-tags.ts` — Tag server actions

### Prior Session Plans
- Session 7: `docs/plans/2026-03-17-refactor-frontend-redesign-session-7-comparison-dataviz-plan.md`
- Session 6: `docs/plans/2026-03-16-refactor-frontend-redesign-session-6-player-profile-plan.md`
- Session 4: `docs/plans/2026-03-16-refactor-frontend-redesign-session-4-player-browse-plan.md`
