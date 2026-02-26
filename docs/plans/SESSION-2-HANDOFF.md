# Session 2 Handoff — Player View Counter + Popular Players Badge

## Status: Ready to implement (plan written, 0% coded)

## What's Already Done (from prior sessions)
Everything in Session 1 is committed. Session 2 is ~85% built — only 3 small gaps remain.

## Last Commit
`87a4fc0` — Polish UI and update project docs (on main, clean working tree)

## Plan File
`docs/plans/2026-02-27-feat-player-views-polish-plan.md` — full plan with acceptance criteria

## The 3 Tasks to Implement

### Task 1: Player Profile — Weekly Views + Trend %
**File:** `src/app/(platform)/players/[slug]/page.tsx`
- Data already fetched: `recentViews` (7 days), `previousViews` (7-14 days)
- Already rendered: total view count in meta grid, Popular badge, Trending badge
- **ADD:** "X views this week (+Y%)" below the existing view count in meta grid
- Edge cases: `previousViews=0` → show "(new)", both=0 → show nothing

### Task 2: Admin Dashboard — "Views All Time" Stat Card
**File:** `src/app/admin/page.tsx`
- Translation key `admin.stats.viewsAllTime` exists but unused
- `perPlayerViewsResult` already fetched (all player_views rows) — just sum the counts
- **ADD:** New stat card in the grid showing total views across all club players

### Task 3: Admin Dashboard — Weekly Context in Per-Player Breakdown
**File:** `src/app/admin/page.tsx`
- Per-player breakdown (top 5) currently shows total counts only
- All player_views rows already fetched with `viewed_at` timestamps
- **ADD:** "X views (Y this week)" format + up/down arrow indicator
- Extend client-side aggregation to also count views per player in last 7 days

## After Implementation
1. `npm run build` — must pass clean
2. Check off items in `docs/plans/2026-02-27-feat-player-views-polish-plan.md`
3. Commit: `feat: Add weekly view stats and trends to profile and admin dashboard`
4. Update CLAUDE.md if any Phase 8 items completed

## Installed Plugins
- **Superpowers** — auto-activates (brainstorming, TDD, debugging, verification)
- **Compound Engineering** — manual `/workflows:plan`, `/workflows:work`, `/workflows:review`

## Dev Server
`npm run dev` → http://127.0.0.1:3000 (kill old processes first if needed)
