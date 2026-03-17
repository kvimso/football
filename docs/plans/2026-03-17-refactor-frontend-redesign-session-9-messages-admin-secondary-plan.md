---
title: "refactor: Frontend Redesign Session 9 — Messages + Admin + Secondary Pages"
type: refactor
status: completed
date: 2026-03-17
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
---

# Session 9 — Messages + Admin + Secondary Pages A3 Restyle

## Enhancement Summary

**Deepened on:** 2026-03-17
**Sections enhanced:** 6
**Review agents used:** code-simplicity-reviewer, kieran-typescript-reviewer, grep-audit (general-purpose), theme-redesign-learning, chat-polish-learning, transfer-redesign-learning
**Learnings applied:** warm-dark-gold-theme-redesign, chat-session-f-polish-reliability-accessibility, transfer-page-premium-redesign

### Key Improvements

1. **15+ missing files discovered** — Grep audit + simplicity reviewer found auth forms (LoginForm, RegisterForm), layout components (NotificationBell, NotificationItem), contact forms, FilterPanel, RequestsList, PlayerCard, 5 error.tsx files, and ClubForm all have hardcoded colors the original plan missed
2. **4 admin files incorrectly claimed "A3-compliant"** — `DashboardStatCards.tsx` (text-red-600), `TransferCard.tsx` (bg-red-500/10 text-red-600), `TransferActions.tsx` (green/red approve/decline), `ReleasePlayerButton.tsx` (text-red-600) all need work
3. **Token replacement map expanded** — Added missing patterns: `border-red-400/30`, `border-t-red-400`, `border-red-600/30`, `border-t-red-600`, `bg-red-500/5`, `bg-red-500/20`, `hover:bg-red-500/20`, `hover:bg-green-500/20`, `bg-red-500` (unread badge), `border-green-400/30`, `border-t-green-400`
4. **Translation keys merged into video step** — TypeScript reviewer: adding translation keys AFTER the video section means broken UI if steps are followed literally. Steps 4+5 merged.
5. **Connection status semantic distinction preserved** — Chat polish learning: reconnecting (gold/warning) vs disconnected (red/error) are intentionally different states, not just two "error" variants. Token mapping must preserve this distinction.
6. **TransferActions.tsx spinner borders added to exceptions** — Transfer learning: `border-green-400/30 border-t-green-400` and `border-red-400/30 border-t-red-400` are CSS spinner borders (the `border-t-*` creates the spinning arc). These map to `border-primary/30 border-t-primary` and `border-danger/30 border-t-danger` — NOT exceptions, they should be replaced.

### Scope Adjustments

1. **Total file count increased from ~25 to ~40** — The missing auth, layout, form, error, and dashboard files bring the actual scope significantly higher
2. **"Already A3-compliant" admin list reduced** — Only `AdminSidebar.tsx`, `DashboardQuickActions.tsx`, `DashboardScoutActivity.tsx`, `PlayerScoutInterest.tsx` are truly compliant

---

## Overview

Final content session before Session 10 (animations + QA + merge). Replace **all** remaining hardcoded Tailwind color classes (`text-red-600`, `bg-red-500/10`, `bg-green-500/10`, `text-green-700`, `bg-yellow-500/15`, `text-yellow-500`, `bg-red-500`, plus border and hover variants) with semantic A3 design tokens across chat, admin, platform admin, auth, layout, form, dashboard, player, and error boundary components (~40 files total). Add video link display to the match detail page.

**Scope from design spec (Session 9):** "Messages + Admin + Secondary Pages — Chat in A3, admin video URL inputs, academy/platform admin pages, Matches/Clubs pages restyled"

**Design moment:** Moment 6: Connection — "Professional, fast, get the deal moving." + Admin pages: "Functional and consistent, not flashy."

## Problem Statement

Sessions 1-8 established the A3 warm off-white palette and restyled the landing page, navigation, player browse, player profile, comparison tool, and dashboard workspace. Three areas remain with hardcoded Tailwind color classes that don't respond to the theme system:

1. **Chat components** (12 files, ~15 hardcoded colors) — error states use `text-red-600`, connection status uses `bg-yellow-500/10 text-yellow-500`
2. **Admin components** (11 files, ~20 hardcoded colors) — approve/reject actions use `bg-green-500/10 text-green-700` and `bg-red-500/10 text-red-600`, pending states use `bg-yellow-500/15`
3. **Match detail page** — fetches `video_url` and `highlights_url` from DB but doesn't display them

Match pages, club pages, match components, and club components are **already A3-compliant** (verified by explorer agent — zero hardcoded colors). No restyle work needed there.

## Proposed Solution

### Token Replacement Map

| Hardcoded Class | A3 Replacement | Semantic Meaning |
|---|---|---|
| `text-red-600` | `text-danger` | Error text, destructive actions, block/reject |
| `text-red-500` | `text-danger` | Hover state on destructive actions |
| `bg-red-500/10` | `bg-danger-muted` | Error/danger background |
| `border-red-500/30` | `border-danger/30` | Error border |
| `text-green-700` | `text-primary` | Success/approve actions (green = primary) |
| `bg-green-500/10` | `bg-primary-muted` | Success/approve background |
| `border-green-500/30` | `border-primary/30` | Success border |
| `text-yellow-500` | `text-pos-gk` | Warning/pending text (gold) |
| `bg-yellow-500/10` | `bg-pos-gk-bg` | Warning/pending background |
| `bg-yellow-500/15` | `bg-pos-gk-bg` | Pending state background |
| `hover:text-red-500` | `hover:text-danger` | Hover on destructive |
| `hover:text-red-600` | `hover:text-danger` | Hover on destructive |
| `hover:bg-red-500/10` | `hover:bg-danger-muted` | Hover on error bg |
| `hover:bg-red-500/20` | `hover:bg-danger-muted` | Hover on error bg (stronger) |
| `hover:bg-green-500/20` | `hover:bg-primary-muted` | Hover on approve bg (stronger) |
| `bg-red-500/5` | `bg-danger-muted` | Very subtle error bg |
| `bg-red-500/20` | `bg-danger-muted` | Moderate error bg |
| `bg-red-500` | `bg-danger` | Solid red (unread badge) |
| `bg-green-500/5` | `bg-primary-muted` | Very subtle success bg |
| `border-red-500/20` | `border-danger/20` | Subtle error border |
| `border-red-600/30` | `border-danger/30` | Error border |
| `border-t-red-600` | `border-t-danger` | Spinner arc (destructive) |
| `border-red-400/30` | `border-danger/30` | Spinner track (destructive) |
| `border-t-red-400` | `border-t-danger` | Spinner arc (destructive) |
| `border-green-400/30` | `border-primary/30` | Spinner track (approve) |
| `border-t-green-400` | `border-t-primary` | Spinner arc (approve) |
| `text-red-500` | `text-danger` | Error text variant |

### Exceptions — DO NOT Replace

| Class | Location | Reason |
|---|---|---|
| `bg-white/20`, `bg-white/30` | MessageBubble.tsx (line 159) | Transparency on `bg-primary` bubble — intentional contrast |
| `text-white`, `text-gray-300` | MessageBubble.tsx (line 269) | Fullscreen image overlay on `bg-black/80` — fixed dark context |
| `border-white/30`, `border-t-white` | MessageAcademyButton.tsx (line 57) | Loading spinner on `bg-primary` button — needs white contrast |
| `bg-black/50`, `bg-black/60`, `bg-black/80` | MobileChatDrawer, PlayerSearchModal, MessageBubble | Overlay backdrops — universal dark |
| `text-cyan-700` | NotificationItem.tsx | No A3 cyan token exists — needs new token or keep |
| `text-blue-700` | NotificationItem.tsx | Could use `text-pos-st` (`#2563EB`/`#5B9CF0`) — close match |
| `text-amber-700`, `bg-amber-500/20` | NotificationItem.tsx, players/[slug]/page.tsx | Could use `text-pos-gk`/`bg-pos-gk-bg` — semantic mismatch but visual match |
| `bg-red-500 text-white` | NotificationBell.tsx | Solid unread badge — standard attention pattern, could map to `bg-danger text-background` |

---

### Files Modified (Chat — A3 token replacement only)

| File | Lines | Changes |
|------|-------|---------|
| `src/components/chat/ChatThread.tsx` | 802 | 5 fixes: `text-red-600`→`text-danger` (3x block UI), `bg-yellow-500/10 text-yellow-500`→`bg-pos-gk-bg text-pos-gk` (reconnecting), `bg-red-500/10 text-red-500`→`bg-danger-muted text-danger` (disconnected) |
| `src/components/chat/MessageBubble.tsx` | 294 | 1 fix: `text-red-600`→`text-danger` (failed to send) |
| `src/components/chat/ChatInput.tsx` | 416 | 5 fixes: `bg-red-500/10`→`bg-danger-muted` (2x error/blocked bg), `text-red-600`→`text-danger` (3x error text/cancel/char limit), `hover:text-red-500`→`hover:text-danger`, `hover:bg-red-500/10`→`hover:bg-danger-muted` |
| `src/components/chat/ChatSidebar.tsx` | 201 | 1 fix: `text-red-600/50`→`text-danger/50` (error icon) |
| `src/components/chat/ChatInbox.tsx` | 181 | 2 fixes: `text-red-600/50`→`text-danger/50` (error icon), `text-red-600`→`text-danger` (blocked icon) |
| `src/components/chat/MessageAcademyButton.tsx` | 83 | 1 fix: `text-red-600`→`text-danger` (error message) |

**6 chat files modified, 6 chat files unchanged** (PlayerRefCard, PlayerSearchModal, DateDivider, ChatEmptyState, MobileChatDrawer, ChatMessagesLayout — already fully A3-compliant).

### Files Modified (Admin — A3 token replacement only)

| File | Lines | Changes |
|------|-------|---------|
| `src/components/admin/DashboardPlayerViews.tsx` | 103 | `text-red-600`→`text-danger` |
| `src/components/admin/PlayerForm.tsx` | 290 | `border-red-500/30`→`border-danger/30`, `bg-red-500/10`→`bg-danger-muted`, `text-red-600`→`text-danger` |
| `src/components/admin/InviteForm.tsx` | 101 | `border-red-500/30`→`border-danger/30`, `bg-red-500/10`→`bg-danger-muted`, `text-red-600`→`text-danger`, `border-green-500/30`→`border-primary/30`, `bg-green-500/10`→`bg-primary-muted` |
| `src/components/admin/AnnouncementForm.tsx` | 83 | `text-red-600`→`text-danger` |
| `src/components/admin/AnnouncementList.tsx` | 83 | `text-red-600`→`text-danger` |
| `src/components/admin/TransferTabs.tsx` | 142 | `bg-yellow-500/15`→`bg-pos-gk-bg` (pending tab) |
| `src/components/admin/TransferSearch.tsx` | 316 | `text-yellow-500`→`text-pos-gk` (free agent indicator) |
| `src/components/admin/RequestActions.tsx` | 95 | `bg-green-500/10 text-green-700`→`bg-primary-muted text-primary`, `bg-red-500/10 text-red-600`→`bg-danger-muted text-danger` |
| `src/components/admin/PlayerActionsMenu.tsx` | 135 | `text-red-600`→`text-danger` |
| `src/components/admin/ScoutDemandCard.tsx` | 126 | `text-red-600`→`text-danger` |

**Also needs work (originally missed):**

| File | Lines | Changes |
|------|-------|---------|
| `src/components/admin/DashboardStatCards.tsx` | 57 | `text-red-600`→`text-danger` (negative trend indicator) |
| `src/components/admin/TransferCard.tsx` | 125 | `bg-red-500/10 text-red-600`→`bg-danger-muted text-danger` (declined status badge) |
| `src/components/admin/TransferActions.tsx` | 79 | `bg-green-500/10 text-green-700`→`bg-primary-muted text-primary`, `bg-red-500/10 text-red-600`→`bg-danger-muted text-danger`, `border-green-400/30 border-t-green-400`→`border-primary/30 border-t-primary`, `border-red-400/30 border-t-red-400`→`border-danger/30 border-t-danger` |
| `src/components/admin/ReleasePlayerButton.tsx` | 48 | `text-red-600`→`text-danger`, `hover:text-red-500`→`hover:text-danger` |

> **Research Insight (Grep Audit + Simplicity):** The original plan listed `DashboardStatCards.tsx`, `TransferCard.tsx` as "already A3-compliant" — they are NOT. `TransferActions.tsx` and `ReleasePlayerButton.tsx` were completely omitted. Only `AdminSidebar.tsx`, `DashboardQuickActions.tsx`, `DashboardScoutActivity.tsx`, `PlayerScoutInterest.tsx` are truly A3-compliant.

### Files Modified (Platform Admin — A3 token replacement)

| File | Lines | Changes |
|------|-------|---------|
| `src/components/platform/PlatformPlayerForm.tsx` | ~300 | Same pattern as admin PlayerForm — `text-red-600`→`text-danger`, error borders |
| `src/components/platform/PlatformRequestsList.tsx` | ~200 | Status colors: `text-green-700`→`text-primary`, `text-red-600`→`text-danger` |
| `src/components/platform/PlatformTransfersList.tsx` | ~200 | Status colors: same pattern |
| `src/components/platform/PlatformSidebar.tsx` | ~120 | Check for any remaining hardcoded colors |
| `src/app/platform/clubs/[id]/edit/page.tsx` | ~80 | Check for hardcoded form error colors |
| `src/app/platform/players/page.tsx` | ~100 | Check for hardcoded status colors |
| `src/app/platform/scouts/[id]/page.tsx` | ~80 | Check for hardcoded colors |
| `src/app/platform/transfers/page.tsx` | ~80 | Check for hardcoded colors |
| `src/app/platform/requests/page.tsx` | ~80 | Check for hardcoded colors |

### Files Modified (Admin Pages — A3 token replacement)

| File | Changes |
|------|---------|
| `src/app/admin/page.tsx` | Check for hardcoded colors in dashboard layout |
| `src/app/admin/players/page.tsx` | Check player list table status colors |
| `src/app/admin/transfers/page.tsx` | Check transfer list status colors |

### Files Modified (Auth Forms — A3 token replacement)

> **Research Insight (Grep Audit):** These were completely missing from the original plan. Auth forms have `border-red-500/30 bg-red-500/10 text-red-600` error patterns identical to admin forms.

| File | Changes |
|------|---------|
| `src/components/auth/LoginForm.tsx` | `border-red-500/30`→`border-danger/30`, `bg-red-500/10`→`bg-danger-muted`, `text-red-600`→`text-danger` |
| `src/components/auth/RegisterForm.tsx` | Same error pattern replacement |

### Files Modified (Layout Components — A3 token replacement)

| File | Changes |
|------|---------|
| `src/components/layout/NotificationBell.tsx` | `bg-red-500`→`bg-danger` (unread count badge) |
| `src/components/layout/NotificationItem.tsx` | `text-red-600`→`text-danger`, `text-green-700`→`text-primary` (notification type colors) |

### Files Modified (Forms — A3 token replacement)

| File | Changes |
|------|---------|
| `src/components/contact/ContactForm.tsx` | `border-red-500/30 bg-red-500/10 text-red-600`→danger tokens |
| `src/components/forms/ContactRequestForm.tsx` | `text-red-600`→`text-danger` |
| `src/components/forms/FilterPanel.tsx` | `border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500/10`→danger tokens (clear/reset button) |

### Files Modified (Dashboard — A3 token replacement)

| File | Changes |
|------|---------|
| `src/components/dashboard/RequestsList.tsx` | `text-yellow-500`→`text-pos-gk`, `text-green-700`→`text-primary`, `bg-green-500/5`→`bg-primary-muted` |

### Files Modified (Player — A3 token replacement)

| File | Changes |
|------|---------|
| `src/components/player/PlayerCard.tsx` | `text-yellow-500`→`text-pos-gk` (free agent label) |

### Files Modified (Player Profile — A3 token replacement)

| File | Changes |
|------|---------|
| `src/app/(platform)/players/[slug]/page.tsx` | `border-yellow-500/30 bg-yellow-500/10 text-yellow-500`→pos-gk tokens (free agent warning), `bg-amber-500/20 text-amber-700`→pos-gk tokens (popular badge) |

### Files Modified (Error Boundaries — A3 token replacement)

| File | Changes |
|------|---------|
| `src/app/error.tsx` | `bg-red-500/10`→`bg-danger-muted`, `text-red-500`→`text-danger` |
| `src/app/admin/error.tsx` | `bg-red-500/10`→`bg-danger-muted`, `text-red-600`→`text-danger` |
| `src/app/dashboard/error.tsx` | Same pattern |
| `src/app/admin/messages/[conversationId]/error.tsx` | Same pattern |
| `src/app/dashboard/messages/[conversationId]/error.tsx` | Same pattern |

### Files Modified (Platform — also missed)

| File | Changes |
|------|---------|
| `src/components/platform/ClubForm.tsx` | `border-red-500/30 bg-red-500/10 text-red-600`→danger tokens |

### Files Modified (Admin Pages — also missed)

| File | Changes |
|------|---------|
| `src/app/admin/transfers/page.tsx` | `bg-yellow-500/10`→`bg-pos-gk-bg`, `text-yellow-500`→`text-pos-gk` (pending badge) |

### Files Modified (Match Detail — Video Display)

| File | Change |
|------|--------|
| `src/app/(platform)/matches/[slug]/page.tsx` | Add video link section displaying `video_url` and `highlights_url` when present |

### Files NOT Changed (Verified A3-Compliant)

- **Match pages:** `matches/page.tsx`, `matches/[slug]/page.tsx` (except video addition), `MatchCard.tsx`, `MatchDetailClient.tsx`, `MatchFilters.tsx`
- **Club pages:** `clubs/page.tsx`, `clubs/[slug]/page.tsx`, `ClubCard.tsx`, `ClubAnnouncements.tsx`
- **Loading skeletons:** All match/club loading.tsx files already use `bg-elevated`
- **6 chat components:** PlayerRefCard, PlayerSearchModal, DateDivider, ChatEmptyState, MobileChatDrawer, ChatMessagesLayout
- **4 admin components:** `AdminSidebar.tsx`, `DashboardQuickActions.tsx`, `DashboardScoutActivity.tsx`, `PlayerScoutInterest.tsx`

### New Files: None

### New Routes: None

### Database Changes: None

### New API Routes: None

---

## Technical Approach

### 1. Chat Components A3 Restyle

**Pattern:** Mechanical find-and-replace within each file. Each replacement maps a hardcoded Tailwind color to a semantic CSS custom property that's already bridged via `@theme inline` in `globals.css`.

**ChatThread.tsx — 5 replacements:**

```tsx
// Connection status banner (line ~669)
// BEFORE:
'bg-yellow-500/10 text-yellow-500'  // reconnecting
'bg-red-500/10 text-red-500'        // disconnected

// AFTER:
'bg-pos-gk-bg text-pos-gk'          // reconnecting (gold = warning)
'bg-danger-muted text-danger'        // disconnected (red = error)

// Block UI (lines ~629, 646, 648)
// BEFORE:
'text-red-600'  // block icon, confirm text, block text

// AFTER:
'text-danger'   // consistent semantic token
```

**ChatInput.tsx — 5 replacements:**

```tsx
// Blocked banner (line ~220)
// BEFORE:
'bg-red-500/10 px-3 py-2 text-sm text-red-600'

// AFTER:
'bg-danger-muted px-3 py-2 text-sm text-danger'

// Error banner (line ~245)
// BEFORE:
'bg-red-500/10 px-3 py-1.5 text-xs text-red-600'

// AFTER:
'bg-danger-muted px-3 py-1.5 text-xs text-danger'

// Cancel pasted image (line ~288)
// BEFORE:
'text-red-600 hover:bg-red-500/10'

// AFTER:
'text-danger hover:bg-danger-muted'

// Character limit (line ~399)
// BEFORE:
'text-red-600'

// AFTER:
'text-danger'
```

**MessageBubble.tsx — 1 replacement:**

```tsx
// Failed to send (line ~209)
// BEFORE:
'text-[11px] text-red-600'

// AFTER:
'text-[11px] text-danger'
```

**ChatSidebar.tsx, ChatInbox.tsx, MessageAcademyButton.tsx** — simple `text-red-600` → `text-danger` replacements.

### 2. Admin Components A3 Restyle

**Same mechanical pattern.** The admin components heavily use hardcoded green/red pairs for approve/reject and success/error states.

**Key mappings for admin:**

```
// Approve/Accept buttons:
bg-green-500/10 text-green-700  →  bg-primary-muted text-primary
border-green-500/30             →  border-primary/30

// Reject/Decline buttons:
bg-red-500/10 text-red-600      →  bg-danger-muted text-danger
border-red-500/30               →  border-danger/30

// Pending/Warning states:
bg-yellow-500/15 text-yellow-500  →  bg-pos-gk-bg text-pos-gk

// Destructive text (delete, release, block):
text-red-600                    →  text-danger
hover:text-red-500              →  hover:text-danger
hover:text-red-600              →  hover:text-danger
```

**InviteForm.tsx example** (has both green success and red error states):

```tsx
// Success message
// BEFORE:
'rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700'

// AFTER:
'rounded-lg border border-primary/30 bg-primary-muted px-4 py-3 text-sm text-primary'

// Error message
// BEFORE:
'rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600'

// AFTER:
'rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger'
```

**RequestActions.tsx example** (approve/decline pair):

```tsx
// Approve button
// BEFORE:
'rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700'

// AFTER:
'rounded-lg bg-primary-muted px-3 py-1.5 text-xs font-medium text-primary'

// Decline button
// BEFORE:
'rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600'

// AFTER:
'rounded-lg bg-danger-muted px-3 py-1.5 text-xs font-medium text-danger'
```

### 3. Platform Admin Components A3 Restyle

Same pattern as admin components. Read each file first, identify hardcoded colors, apply the token replacement map. Platform admin pages follow the same patterns as academy admin.

### 4. Match Detail Video Links

Add a small video section below the match header card when `video_url` or `highlights_url` exist. This data is already fetched in the page query (line 50) but not displayed.

```tsx
// After the match header card, before the match report:
{(match.video_url || match.highlights_url) && (
  <div className="mt-4 flex flex-wrap gap-3">
    {match.video_url && (
      <a
        href={match.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
      >
        <svg className="h-4 w-4 text-danger" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        {t('matches.watchFullMatch')}
      </a>
    )}
    {match.highlights_url && (
      <a
        href={match.highlights_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
      >
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        {t('matches.highlights')}
      </a>
    )}
  </div>
)}
```

> **Research Insight (TypeScript Reviewer):** Translation keys MUST be added in the same step as the video section. If a developer follows the original plan's execution order (Step 4 → Step 5), the video section renders raw translation key strings until Step 5 completes. Merge these into a single atomic step.

**Translation keys (add in same commit as video section):**

Add to `src/lib/translations/` (matches domain):

```
matches.watchFullMatch → "Watch Full Match" / "სრული მატჩის ყურება"
matches.highlights → "Highlights" / "საუკეთესო მომენტები"
```

**Exact insertion point:** Between line 133 (end of match header card `</div>`) and line 135 (start of `<MatchDetailClient type="report" ... />`).

### 5. Admin Video URL Inputs — Scope Decision

**Deferred.** The design spec mentions "Video URL input fields for match management" but:
- Admin currently has no match editing routes (`/admin/matches/` doesn't exist)
- CLAUDE.md states matches are camera-only
- Creating an admin match edit page is a new feature, not a restyle
- The `video_url` / `highlights_url` columns exist in the DB and will be populated by the Phase 7 camera integration

**What we DO in this session:** Display existing video URLs on the match detail page (Step 4 above). This surfaces the data when Phase 7 populates it, or if URLs are added via Supabase dashboard.

**What we DON'T do:** No new admin routes for match management. No changes to RLS policies. This is a Phase 7 concern.

---

## Execution Order

### Step 1: Chat Components (6 files)

1. Open each of the 6 chat files listed in the chat section
2. Apply the token replacement map mechanically
3. Pay attention to the **exceptions list** — do NOT replace `bg-white/20`, `text-white`, `bg-black/*` overlay classes
4. Verify: `npm run build` passes

> **Research Insight (Chat Polish Learning):** The reconnecting banner (`bg-pos-gk-bg text-pos-gk`) and disconnected banner (`bg-danger-muted text-danger`) are intentionally different semantic states — gold = "working on it", red = "broken". Preserve this distinction. Also ensure the `animate-slide-in-down` class on these banners is not accidentally removed during replacement.

**Checkpoint:** `grep -rn "text-red-\|bg-red-\|text-green-\|bg-green-\|text-yellow-\|bg-yellow-" src/components/chat/` → zero matches.

### Step 2: Admin Components (14 files)

1. Open all 14 admin files (original 10 + 4 newly discovered: `DashboardStatCards`, `TransferCard`, `TransferActions`, `ReleasePlayerButton`)
2. Apply the token replacement map
3. Special attention to **paired approve/decline buttons** — both sides must use semantic tokens
4. `TransferActions.tsx` has spinner borders (`border-green-400/30 border-t-green-400`) — replace with `border-primary/30 border-t-primary` (and same for red → danger)

**Checkpoint:** `grep -rn "text-red-\|bg-red-\|text-green-\|bg-green-\|text-yellow-\|bg-yellow-\|border-red-\|border-green-" src/components/admin/` → zero matches.

### Step 3: Platform Admin Components + Pages + ClubForm

1. All platform components + `ClubForm.tsx` (originally missed)
2. Check page-level files (`src/app/platform/**/*.tsx`, `src/app/admin/**/*.tsx`) for hardcoded colors
3. Include `src/app/admin/transfers/page.tsx` (has `bg-yellow-500/10`, `text-yellow-500`)

**Checkpoint:** Same grep across `src/components/platform/`, `src/app/admin/`, `src/app/platform/` → zero matches.

### Step 4: Auth, Layout, Forms, Dashboard, Player Components

> **Research Insight (Grep Audit):** These files were completely missing from the original plan but all contain hardcoded colors.

1. **Auth forms:** `LoginForm.tsx`, `RegisterForm.tsx` — error state colors
2. **Layout:** `NotificationBell.tsx` (`bg-red-500`→`bg-danger`), `NotificationItem.tsx` (`text-red-600`→`text-danger`, `text-green-700`→`text-primary`)
3. **Forms:** `ContactForm.tsx`, `ContactRequestForm.tsx`, `FilterPanel.tsx`
4. **Dashboard:** `RequestsList.tsx` (yellow/green status colors)
5. **Player:** `PlayerCard.tsx` (`text-yellow-500`→`text-pos-gk` for free agent label)

**Checkpoint:** `grep -rn "text-red-\|bg-red-\|text-green-\|bg-green-\|text-yellow-\|bg-yellow-" src/components/auth/ src/components/layout/ src/components/forms/ src/components/dashboard/ src/components/player/` → zero matches (excluding known exceptions).

### Step 5: Error Boundaries (5 files)

1. Replace `bg-red-500/10`→`bg-danger-muted` and `text-red-500`/`text-red-600`→`text-danger` in:
   - `src/app/error.tsx`
   - `src/app/admin/error.tsx`
   - `src/app/dashboard/error.tsx`
   - `src/app/admin/messages/[conversationId]/error.tsx`
   - `src/app/dashboard/messages/[conversationId]/error.tsx`

### Step 6: Match Detail Video Section + Translation Keys

1. Add translation keys for `matches.watchFullMatch` and `matches.highlights` (FIRST — before the JSX)
2. Add video link section to `src/app/(platform)/matches/[slug]/page.tsx` between lines 133 and 135
3. Verify: page renders correctly with and without video URLs (currently all null in DB — should show nothing)

### Step 7: Loading Skeleton Check

1. Verify all loading.tsx files in `src/app/admin/`, `src/app/platform/`, `src/app/dashboard/messages/`, `src/app/admin/messages/` use `bg-elevated` for skeleton pulses
2. Fix any that use old tokens

### Step 8: Global Verification

1. `npm run build` — must pass with zero errors
2. Run **comprehensive** global hardcoded color audit:
   ```bash
   grep -rn "text-red-\|bg-red-\|border-red-\|text-green-\|bg-green-\|border-green-\|text-yellow-\|bg-yellow-\|border-yellow-" src/components/ src/app/ --include="*.tsx" --include="*.ts"
   ```
   Expected: zero matches outside of intentional exceptions (overlay backdrops, spinner on primary bg)
3. Also check for `hover:` variants: `grep -rn "hover:text-red-\|hover:bg-red-\|hover:text-green-\|hover:bg-green-" src/ --include="*.tsx"`
4. Visual spot-check in browser: light mode + dark mode for chat, admin, match detail, login/register, and error pages

---

## Scope Decisions

| Decision | Rationale |
|---|---|
| Match/Club pages need NO restyle work | Explorer agent confirmed all use A3 tokens already |
| 6 of 12 chat components need NO changes | Already fully A3-compliant from Phase 6.5 build |
| Admin video URL editing deferred | Camera-only rule + no admin match routes = Phase 7 scope |
| `bg-white/20` on sent message file buttons kept | Intentional transparency on `bg-primary` — white provides contrast |
| `text-white` on fullscreen overlay kept | Fixed dark context (`bg-black/80`) — not theme-dependent |
| `bg-green-500/10 text-green-700` → `bg-primary-muted text-primary` | Green = primary in A3 palette — approve/success is the primary action |
| `bg-yellow-500/15` → `bg-pos-gk-bg` | Gold/yellow = GK position color, also used for warning/pending states |
| No layout changes in admin/platform | Spec says "Functional and consistent, not flashy" — token swap only |

---

## Acceptance Criteria

### Functional
- [x] All chat error/warning states render with correct A3 semantic colors
- [x] Chat connection status banner uses `bg-pos-gk-bg text-pos-gk` (reconnecting) and `bg-danger-muted text-danger` (disconnected)
- [x] Admin approve/decline buttons use `bg-primary-muted text-primary` and `bg-danger-muted text-danger`
- [x] Admin pending states use `bg-pos-gk-bg text-pos-gk`
- [x] Admin destructive actions (delete, release, block) use `text-danger`
- [x] Match detail page shows "Watch Full Match" / "Highlights" links when URLs exist
- [x] Match detail page renders cleanly when video URLs are null (no empty section)
- [x] All loading skeletons use `bg-elevated` for pulse animations
- [x] New translation keys exist for both en and ka
- [x] Auth form errors (login, register) render with `text-danger` and `bg-danger-muted`
- [x] Notification bell unread badge uses `bg-danger` (not `bg-red-500`)
- [x] NotificationItem type colors use `text-danger`/`text-primary` (not hardcoded)
- [x] FilterPanel clear button uses danger tokens
- [x] All 5 error.tsx boundary pages use `bg-danger-muted text-danger`
- [x] PlayerCard free agent label uses `text-pos-gk` (not `text-yellow-500`)
- [x] TransferActions approve/decline spinners use `border-primary`/`border-danger` tokens

### Non-Functional
- [x] `npm run build` passes with zero errors
- [x] Global grep for hardcoded colors returns zero matches in `src/components/` and `src/app/` (including `border-red-`, `border-green-`, hover variants)
- [ ] Both light and dark modes look correct for chat, admin, match detail, login/register, and error pages
- [ ] Both languages (en/ka) verified
- [x] No functional regressions in chat (sending, receiving, file upload, block/unblock)
- [x] No functional regressions in admin (player CRUD, transfer actions, invitations)
- [x] No functional regressions in auth (login, register error handling)

---

## Dependencies & Risks

### Dependencies
- Sessions 1-8 must be complete (A3 palette, `@theme inline` bridge, ThemeProvider, all CSS custom properties)
- `globals.css` must have `--danger`, `--danger-muted`, `--pos-gk`, `--pos-gk-bg` tokens defined (verified: they exist)

### Risks
| Risk | Mitigation |
|---|---|
| Missing a hardcoded color somewhere | Step 6 global grep audit catches stragglers |
| `bg-danger-muted` contrast insufficient on some surfaces | Test on both `bg-background` and `bg-surface` containers in both themes |
| Platform admin components have different patterns than academy admin | Read each file before replacing — don't blindly apply |
| Video URL section layout looks odd without actual URLs | No video data currently exists — section is conditionally hidden, so no visual impact until Phase 7 |

---

## Future Work (NOT in Session 9)

- **Session 10:** Animations (fade-ins, count-up stats, hover effects), mobile polish at 375px, Playwright visual verification, merge to main
- **Phase 7:** Camera integration populates `video_url`, `highlights_url` — the match detail section added here will automatically display them
- **Post-merge:** Admin video URL management routes (if needed before Phase 7)

---

## Sources

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` (Session 9 scope: line 475, Moment 6: lines 402-410, Admin pages: lines 428-434, Secondary pages: lines 420-423)
- **Session 8 plan:** `docs/plans/2026-03-17-refactor-frontend-redesign-session-8-dashboard-watchlist-plan.md` (pattern reference for plan structure)
- **A3 palette:** `src/app/globals.css` (lines 1-111, all tokens)
- **Token replacement map:** `src/lib/constants.ts` (POSITION_COLOR_CLASSES)
- **Chat components:** `src/components/chat/` (12 files, Phase 6.5)
- **Admin components:** `src/components/admin/` (18 files, Phase 4)
- **Platform components:** `src/components/platform/` (6 files, Phase 4)
