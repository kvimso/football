---
title: "feat: Player View Counter + Popular Players Badge (Session 2)"
type: feat
status: completed
date: 2026-02-27
---

# Player View Counter + Popular Players Badge

## Overview

Session 2 builds on the player views tracking from Session 1. Most features are already implemented — this session closes the remaining gaps: numeric view context on the profile page, "Views All Time" on admin dashboard, and weekly context in the per-player breakdown.

## What Already Exists

| Feature | File | Status |
|---------|------|--------|
| Total view count on profile ("X scout views") | `src/app/(platform)/players/[slug]/page.tsx:281-291` | Done |
| Popular badge (>=20 views) on profile | `src/app/(platform)/players/[slug]/page.tsx:197-207` | Done |
| Trending badge on profile | `src/app/(platform)/players/[slug]/page.tsx:208-216` | Done |
| Popular badge on PlayerCard | `src/components/player/PlayerCard.tsx:75-79` | Done |
| View count eye badge on PlayerCard | `src/components/player/PlayerCard.tsx:80-87` | Done |
| `POPULAR_VIEWS_THRESHOLD = 20` constant | `src/lib/constants.ts:34` | Done |
| Admin "Views This Week" stat card with % trend | `src/app/admin/page.tsx:194-199` | Done |
| Admin per-player breakdown (top 5) | `src/app/admin/page.tsx:295-311` | Done |
| Admin scout activity feed (last 20) | `src/app/admin/page.tsx:314-344` | Done |
| All translation keys (EN + KA) | `src/lib/translations.ts` | Done |
| Data fetching: `recentViews`, `previousViews` on profile | `src/app/(platform)/players/[slug]/page.tsx:92-102` | Done (fetched, not all rendered) |

## What Needs Building

### 1. Profile Page: Numeric Weekly Views + Trend Percentage

**File:** `src/app/(platform)/players/[slug]/page.tsx`

The profile already fetches `recentViews` (last 7 days) and `previousViews` (7-14 days) and computes `isTrending`. But it only shows a binary Trending badge — no numeric context.

**Add below the existing view count in the meta grid:**
- "X views this week" (using `recentViews` value)
- If `previousViews > 0`: show percentage change "(+Y% vs last week)" or "(-Y%)" in green/red
- If `previousViews === 0` and `recentViews > 0`: show "(new)" instead of a percentage

**Acceptance criteria:**
- [x] Show `recentViews` count with "this week" label in the player meta grid
- [x] Show percentage change vs previous week (green if up, red if down)
- [x] Handle edge case: `previousViews = 0` — show "(new)" not "Infinity%"
- [x] Handle edge case: both weeks = 0 — show nothing (already handled by `totalViews > 0` guard)

### 2. Admin Dashboard: "Views All Time" Stat Card

**File:** `src/app/admin/page.tsx`

Translation key `admin.stats.viewsAllTime` exists but is not rendered. The data is already available — `viewsThisWeek` is queried but no all-time count query exists.

**Add to the stat cards grid:**
- New stat card: "Views All Time" showing total view count across all club players
- Position it alongside the existing "Views This Week" card

**Implementation:**
- Add a query: count all `player_views` rows where `player_id` is in club's players (no date filter)
- Or: sum the existing `perPlayerViewsResult` counts (already fetched, just needs summing)
- Use existing `admin.stats.viewsAllTime` translation key

**Acceptance criteria:**
- [x] "Views All Time" stat card appears in the admin dashboard grid
- [x] Shows total view count for all club players combined
- [x] Uses existing translation key `admin.stats.viewsAllTime`

### 3. Admin Dashboard: Weekly Context in Per-Player Breakdown

**File:** `src/app/admin/page.tsx`

The per-player breakdown (lines 295-311) shows total counts only. Admin can't tell if interest is recent or historical.

**Enhance the breakdown to show:**
- "Player Name: X views (Y this week)" format
- Small up/down arrow if this week > last week for that player

**Implementation:**
- The page already fetches all `player_views` rows (limit 10000) for client-side aggregation
- Extend the aggregation to also count views per player in the last 7 days
- Compare per-player this-week count vs previous-week count for arrow indicator

**Acceptance criteria:**
- [x] Per-player breakdown shows "X views (Y this week)" format
- [x] Up arrow shown if this week's views > previous week
- [x] Down arrow or no indicator if this week <= previous week
- [x] Sorted by total view count descending (existing behavior preserved)

## Design Decisions (Pre-resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Show Trending badge on PlayerCard? | No — profile only | Cards already show Popular badge + view count; adding Trending needs extra data fetching per player on list page, bad for performance |
| Show view counts on player list page? | Already done | `viewCountMap` fetched on `/players` page, passed to PlayerCard |
| Show "0 views" explicitly? | No — hide when 0 | Current behavior is correct; new players look clean, not "unpopular" |
| Per-player breakdown: top 5 or all? | Keep top 5 | Manageable size for dashboard; full analytics is a future feature |

## Files Changed

| File | Scope |
|------|-------|
| `src/app/(platform)/players/[slug]/page.tsx` | Add weekly view count + trend % to meta grid |
| `src/app/admin/page.tsx` | Add "Views All Time" stat card + weekly context in per-player breakdown |

**No new files. No new migrations. No new translations (all keys already exist).**

## Verification

1. `npm run build` — zero TypeScript errors
2. Player profile — shows "X scout views", "Y this week (+Z%)" when views exist
3. Admin dashboard — "Views All Time" card visible, per-player shows "(Y this week)"
4. Edge case — new player with 0 views: no view-related UI shown
5. Edge case — player with views only this week (no previous): shows "(new)" not "Infinity%"
6. Georgian language — all labels render correctly
