---
title: "Fix Filter Panel z-index & Add Club Search"
type: fix
status: completed
date: 2026-03-01
---

# Fix Filter Panel z-index & Add Club Search

## Overview

Two issues with the newly redesigned FilterPanel:

1. **Z-index bug**: FilterPopover dropdowns render behind PlayerCards because `backdrop-blur-sm` on the FilterPanel container creates a stacking context, trapping `z-30` popovers inside it
2. **Club search**: The club popover needs a search input for future scalability (many clubs)

## Problem Statement

**Z-index root cause**: The FilterPanel outer `<div>` at `FilterPanel.tsx:140` uses `backdrop-blur-sm`. The CSS `backdrop-filter` property creates a new stacking context. The `z-30` popover inside only stacks relative to that context — not the page. PlayerCards below it, being later in DOM order, paint on top.

**Club UX issue**: Currently the club popover shows all clubs as a flat list of chips. As more clubs join the platform, this becomes unusable. Need a search/filter input inside the popover.

## Proposed Solution

### Fix 1: Z-index — Add `relative z-10` to FilterPanel container

**File:** `src/components/forms/FilterPanel.tsx:140`

Change:
```tsx
<div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
```
To:
```tsx
<div className="relative z-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
```

This elevates the entire FilterPanel stacking context above the player grid. Internal `z-30` popovers remain correctly layered within.

### Fix 2: Club Search Input in Popover

**File:** `src/components/forms/FilterPanel.tsx` (~line 74, 187-206)

- Add state: `const [clubSearch, setClubSearch] = useState('')`
- Filter clubs: case-insensitive match against `name` and `name_ka`
- Add glass-styled search input at top of club popover
- Show "No clubs found" empty state when search has no matches

### Fix 3: i18n keys

**File:** `src/lib/translations.ts`

- English: `searchClub: 'Search clubs...'`
- Georgian: `searchClub: 'კლუბების ძებნა...'`

## Acceptance Criteria

- [x] FilterPopover dropdowns render ABOVE player cards on all screen sizes
- [x] Club popover includes a search input that filters the club list
- [x] Club search works in both English and Georgian (matches both name fields)
- [x] Search is case-insensitive
- [x] Empty state shown when no clubs match search
- [x] New i18n keys added for en + ka
- [x] Build passes with zero new errors
