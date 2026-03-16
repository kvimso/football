---
title: "refactor: Frontend Redesign Session 5 — AI Search Restyle"
type: refactor
status: completed
date: 2026-03-16
origin: docs/superpowers/specs/2026-03-16-frontend-redesign-design.md
deepened: 2026-03-16
---

# Frontend Redesign Session 5 — AI Search Restyle

## Enhancement Summary

**Deepened on:** 2026-03-16
**Research agents used:** Code Simplicity Reviewer, Pattern Recognition Specialist, Kieran TypeScript Reviewer, Julik Frontend Races Reviewer, Architecture Strategist, Performance Oracle, Security Sentinel, Frontend Design Skill, UI Redesign Learning Applicability

### Key Improvements from Research

1. **Bump input tint from `/[0.04]` to `/[0.06]`** — Green at 4% opacity over `#FDFCFA` produces `~#F7FBF8`, which is imperceptible on most monitors. Purple had higher perceived saturation at low opacities. `/[0.06]` is the minimum for a visible green tint. The border (`border-primary/20`) is the primary visual cue; the tint is supplementary but should be perceptible if included at all.

2. **Bump tag remove button from `/40` to `/50`** — `text-primary/40` on a light background produces ~5.8:1 lightness ratio against the green, but the effective color is very washed out. `/50` ensures AA contrast (4.5:1 minimum) for the small interactive element, matching the `/50` used on history chip icons.

3. **Add 2 notification files to scope** — `NotificationItem.tsx` and `NotificationList.tsx` each have one `text-purple-700` on the `free_agent` notification type icon. One-line change each. Eliminates ALL purple from the codebase in a single pass. Change to `text-foreground-muted` (free agent notifications are informational, not a distinct category warranting a unique color).

4. **Add unmount abort cleanup to AISearchBar** — Currently, navigating away during an AI search leaves an orphaned fetch request. The response may call `onSearchResults` on an unmounted parent. Fix: 3-line `useEffect` cleanup that calls `abortRef.current?.abort()`. Trivial cost, prevents real bugs on mobile (Georgian scouts on spotty connections).

5. **Green "Clear All" vs red "Clear All" is semantically correct** — The Architecture reviewer confirmed: FilterPanel's red "Clear All" means "remove my manual choices" while AI's green "Clear All" means "exit AI mode." This is an appropriate semantic distinction, not an inconsistency.

6. **AI filter tags are already visually distinct from regular filter chips** — After migration, AI tags are `bg-primary/10 text-primary border-primary/20` (prominent green) while regular FilterPanel chips are `bg-surface text-foreground-muted` (neutral). The dimming of FilterPanel during AI mode (opacity-40) reinforces the distinction. No additional differentiation needed.

7. **Verify filter tag contrast in dark mode** — `bg-primary/10` in dark mode is `rgba(74,222,128,0.1)` over `#12110F` = very dark green. At 11px font size, verify readability. If insufficient, bump to `bg-primary/15`.

### Scope Adjustments from Research

| Original Plan Item | Decision | Reason |
|---|---|---|
| `bg-primary/[0.04]` input tint | **Bump to `/[0.06]`** | Green imperceptible at 4% opacity (Learning + Design agents) |
| `text-primary/40` remove button | **Bump to `/50`** | AA contrast concern on light background (Learning agent) |
| 3 files in scope | **Add 2 more files** | NotificationItem.tsx + NotificationList.tsx — eliminates all purple (Simplicity + Architecture) |
| CSS-only changes | **Add 3-line abort cleanup** | Orphaned fetch on unmount — trivial fix, real benefit (Races reviewer) |
| Separate loading text style | **Keep as-is** | Design agent suggested `text-foreground-muted` but `text-primary animate-pulse` is more visible during the 1-3s AI processing delay |

---

## Overview

Restyle the existing AI search components (`AISearchBar`, `AIFilterTags`) from a purple accent color scheme to the A3 palette, fix known styling bugs, and verify visual integration with the Session 4 browse layout. This is a color-swap session — no logic, API, or structural changes.

**Branch:** Continue on `redesign/light-navy`

**Prerequisite:** Sessions 1-4 complete (A3 palette, ThemeProvider, navbar, landing page, player browse redesign).

## Problem Statement / Motivation

The AI search feature was built with a purple accent color scheme (`border-purple-500`, `bg-purple-500/10`, `text-purple-700`) that predates the A3 design system. It now clashes with the green primary palette established in Sessions 1-4. Additionally, three styling bugs were found:

1. **History dropdown hover is invisible** — `hover:bg-surface` on items whose parent is `bg-surface` produces no visual change.
2. **Error text uses hardcoded color** — `text-red-600` instead of `text-danger` token, which breaks dark mode contrast.
3. **AI empty state button uses `text-purple-300`** — a dark-only shade that's nearly invisible in light mode.

## Proposed Solution

### Color Migration Strategy

Replace all `purple-*` Tailwind classes with A3 primary token equivalents. The sparkle icon + "AI Search" label provides visual distinction from regular filters — no separate accent color needed.

| Current (purple) | New (A3 primary) |
|---|---|
| `text-purple-700/70` | `text-primary` |
| `text-purple-700/80` | `text-primary` |
| `text-purple-700` | `text-primary` |
| `text-purple-500/50` | `text-primary/50` |
| `text-purple-500/40` | `text-primary/50` (bumped from /40 for AA contrast) |
| `text-purple-300` | `text-primary` |
| `border-purple-500/20` | `border-primary/20` |
| `border-purple-500/30` | `border-primary/30` |
| `border-purple-500/15` | `border-primary/15` |
| `bg-purple-500/[0.04]` | `bg-primary/[0.06]` (bumped from /[0.04] for visibility) |
| `bg-purple-500/10` | `bg-primary/10` |
| `bg-purple-500/5` | `bg-primary/5` |
| `hover:bg-purple-500/20` | `hover:bg-primary/20` |
| `hover:bg-purple-500/10` | `hover:bg-primary/10` |
| `hover:text-purple-500` | `hover:text-primary` |
| `hover:text-purple-700` | `hover:text-primary` |
| `focus:border-purple-500/40` | `focus:border-primary/40` |

### Bug Fixes

| Bug | Current | Fix |
|---|---|---|
| History hover invisible | `hover:bg-surface` | `hover:bg-elevated` |
| Hardcoded error color | `text-red-600` | `text-danger` |
| Retry hover color | `hover:text-red-500` | `hover:text-danger/80` |
| Empty state button | `text-purple-300` | `text-primary` |
| Empty state icon | `text-purple-700/20` | `text-primary/20` |

### Files Changed

| File | Change | Scope |
|---|---|---|
| `src/components/player/AISearchBar.tsx` | Purple → primary, fix history hover, fix error colors, add unmount abort | Restyle + fix |
| `src/components/player/AIFilterTags.tsx` | Purple → primary on tags, label, clear-all button | Restyle |
| `src/components/player/PlayerDirectoryClient.tsx` | Purple → primary on AI clear button + empty state | Minor |
| `src/components/layout/NotificationItem.tsx` | `text-purple-700` → `text-foreground-muted` (1 line) | Cleanup |
| `src/components/dashboard/NotificationList.tsx` | `text-purple-700` → `text-foreground-muted` (1 line) | Cleanup |

### Files NOT Changed

- `src/lib/ai-search/service.ts` — AI service logic untouched
- `src/lib/ai-search/prompt.ts` — System prompt untouched
- `src/lib/ai-search/types.ts` — Schema untouched
- `src/app/api/players/ai-search/route.ts` — API route untouched
- `src/app/api/players/ai-search/history/route.ts` — History API untouched
- `src/lib/translations/players.ts` — All keys already exist
- `src/components/forms/FilterPanel.tsx` — Session 4 (complete)
- `src/components/player/PlayerCard.tsx` — Session 4 (complete)

---

## Technical Approach

### 1. AISearchBar.tsx — Full Restyle

**Input field (line 167):**
```tsx
// Before:
className="w-full rounded-xl border border-purple-500/20 bg-purple-500/[0.04] pl-10 pr-10 py-2.5 text-sm text-foreground placeholder-foreground-muted/60 outline-none transition-all focus:border-purple-500/40 disabled:opacity-50"

// After (note: /[0.06] not /[0.04] — green needs higher opacity for visibility):
className="w-full rounded-xl border border-primary/20 bg-primary/[0.06] pl-10 pr-10 py-2.5 text-sm text-foreground placeholder-foreground-muted/60 outline-none transition-all focus:border-primary/40 disabled:opacity-50"
```

**Sparkle icon (line 146):**
```tsx
// Before: text-purple-700/70
// After: text-primary
```

**Search button (line 191):**
```tsx
// Before:
className="inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-700 transition-all hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"

// After:
className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
```

**Analyzing text (line 235):**
```tsx
// Before: text-purple-700/70 animate-pulse
// After: text-primary animate-pulse
```

**Error message (line 240-251):**
```tsx
// Before: text-red-600 ... hover:text-red-500
// After: text-danger ... hover:text-danger/80
```

**History dropdown items (line 267) — BUG FIX:**
```tsx
// Before: hover:bg-surface hover:text-foreground
// After: hover:bg-elevated hover:text-foreground
```

**History chips (line 299):**
```tsx
// Before: border-border bg-surface ... hover:bg-surface hover:text-foreground
// After: border-border bg-surface ... hover:bg-elevated hover:text-foreground

// Before (icon): text-purple-700/50
// After (icon): text-primary/50
```

**Unmount abort cleanup (add after existing useEffect blocks, ~line 60):**
```tsx
// Abort in-flight search on unmount — prevents orphaned requests
useEffect(() => {
  return () => { abortRef.current?.abort() }
}, [])
```

### 2. AIFilterTags.tsx — Full Restyle

**Label (line 98):**
```tsx
// Before: text-purple-700/80
// After: text-primary
```

**Filter tag pills (line 105):**
```tsx
// Before:
className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-700"

// After:
className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
```

**Remove button on tags (line 110):**
```tsx
// Before: text-purple-500/50 hover:text-purple-700
// After: text-primary/50 hover:text-primary
// Note: /50 not /40 — ensures AA contrast on light backgrounds
```

**Clear all button (line 127-128):**
```tsx
// Before:
className="ml-auto inline-flex items-center gap-1 rounded-full border border-purple-500/15 bg-purple-500/5 px-2.5 py-1 text-[11px] font-medium text-purple-700/70 transition-colors hover:bg-purple-500/10 hover:text-purple-500"

// After:
className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
```

### 3. PlayerDirectoryClient.tsx — Minor Restyle

**AI clear button in results header (line 202):**
```tsx
// Before: text-purple-700/70 hover:text-purple-500
// After: text-primary/70 hover:text-primary
```

**AI empty state icon (line 351):**
```tsx
// Before: text-purple-700/20
// After: text-primary/20
```

**AI empty state clear button (line 356):**
```tsx
// Before:
className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors"

// After:
className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
```

### 4. Notification Files — Purple Cleanup

**`src/components/layout/NotificationItem.tsx` (line 22):**
```tsx
// Before: color: 'text-purple-700'  (free_agent notification type)
// After: color: 'text-foreground-muted'
```

**`src/components/dashboard/NotificationList.tsx` (line 26):**
```tsx
// Before: color: 'text-purple-700'  (free_agent notification type)
// After: color: 'text-foreground-muted'
```

These are the only remaining `purple-*` references in the codebase. After this session, `grep -r "purple" src/` should return zero matches.

---

## Technical Considerations

### Dark Mode

All A3 primary tokens are already theme-aware:
- Light: `--primary: #1B8A4A` (forest green)
- Dark: `--primary: #4ADE80` (bright green)

The `bg-primary/10`, `bg-primary/20`, `border-primary/20` opacity patterns produce appropriate tints in both themes because Tailwind resolves the color value first, then applies opacity.

**Input tint verification:** `bg-primary/[0.06]` on the input field — green at 6% opacity produces:
- Light: `#1B8A4A` at 6% over `#FDFCFA` ≈ `#F5FAF6` (subtle warm green, perceptible)
- Dark: `#4ADE80` at 6% over `#12110F` ≈ `#161A14` (subtle warm tint, perceptible)

If 6% is still too subtle on the tester's monitor, bump to `bg-primary/[0.08]`. The border (`border-primary/20`) is the primary visual cue.

**Filter tag dark mode contrast check:** `bg-primary/10` with `text-primary` at 11px font size. In dark mode, `rgba(74,222,128,0.1)` over `#12110F` creates a very dark green surface. Verify `text-primary` (`#4ADE80`) is readable on this surface. If not, bump tags to `bg-primary/15`.

### No New Tokens Needed

All replacements use existing Tailwind color utilities that resolve through the `@theme inline` block in `globals.css`. No new CSS custom properties required.

### History Dropdown Hover Fix

The current `hover:bg-surface` produces no visual change because the dropdown itself is `bg-surface`. Changing to `hover:bg-elevated` gives appropriate feedback:
- Light: `#F4F1EC` → `#EAE6DF` on hover
- Dark: `#1C1A17` → `#2A2623` on hover

### Error State Token Usage

`text-danger` resolves to:
- Light: `#CC3333`
- Dark: `#E05252`

Both have good contrast on their respective backgrounds. The `hover:text-danger/80` reduces opacity slightly for the retry link hover, avoiding the need for a separate `--danger-hover` token.

### Feature Gate Preserved

The `NEXT_PUBLIC_AI_SEARCH_ENABLED` check at `AISearchBar.tsx:134` remains untouched. When disabled, `AISearchBar` returns `null` and no AI-related UI renders.

---

## Scope Boundaries — Session 5 vs Other Sessions

| Feature | Session | Why |
|---|---|---|
| AI search color restyle | **5** | This session |
| History dropdown hover fix | **5** | Bug fix during restyle |
| Error state token fix | **5** | Bug fix during restyle |
| Empty state button fix | **5** | Bug fix during restyle |
| Player profile page | **6** | Different page entirely |
| Comparison page | **7** | Different page entirely |
| Dashboard + Watchlist | **8** | Different page entirely |
| AI search logic changes | **Never in redesign** | Not a redesign concern |
| New AI features | **Post-redesign** | Not in scope |

---

## Execution Order (3 Steps)

### Step 1: Restyle AISearchBar + AIFilterTags
**Files:** `src/components/player/AISearchBar.tsx`, `src/components/player/AIFilterTags.tsx`

1. In `AISearchBar.tsx`: replace all `purple-*` classes with `primary` equivalents (see mapping table — note `/[0.06]` on input, not `/[0.04]`)
2. Add unmount abort cleanup: `useEffect(() => { return () => { abortRef.current?.abort() } }, [])` after existing useEffect blocks
3. Fix history dropdown hover: `hover:bg-surface` → `hover:bg-elevated` (two places: dropdown items + chips)
4. Fix error text: `text-red-600` → `text-danger`, `hover:text-red-500` → `hover:text-danger/80`
5. In `AIFilterTags.tsx`: replace all `purple-*` classes with `primary` equivalents (note `/50` on remove button, not `/40`)
6. Test: both themes, both languages, hover states on history items

### Step 2: Restyle PlayerDirectoryClient + Notification Cleanup
**Files:** `src/components/player/PlayerDirectoryClient.tsx`, `src/components/layout/NotificationItem.tsx`, `src/components/dashboard/NotificationList.tsx`

1. Fix AI clear button color (line 202)
2. Fix AI empty state icon + button colors (lines 351-360)
3. Change `text-purple-700` → `text-foreground-muted` in NotificationItem.tsx (line 22)
4. Change `text-purple-700` → `text-foreground-muted` in NotificationList.tsx (line 26)
5. Verify: `grep -r "purple" src/` returns zero matches

### Step 3: Build + Visual Verification
1. `npm run build` — catch TypeScript errors
2. Visual verification:
   - Both light and dark mode
   - Mobile at 375px
   - Both en and ka
   - AI search flow: type query → loading → results → filter tags → remove tag → clear all
   - History dropdown: focus input → see dropdown → click item → verify `bg-elevated` hover
   - History chips: click chip → search executes → verify `bg-elevated` hover
   - Error state: `text-danger` correct in both themes
   - Empty state: "no matches" with clear button visible in both themes
   - AI mode + view toggle combo (grid/list)
   - AI mode active → regular FilterPanel dimmed
   - **Dark mode contrast check:** filter tag pills readable at 11px on `bg-primary/10` (bump to `/15` if not)
   - **Input tint check:** green tint perceptible at `/[0.06]` in both themes (bump to `/[0.08]` if not)
   - Zero `purple-*` references remaining in `src/`

---

## Acceptance Criteria

- [x] All `purple-*` color classes replaced with A3 `primary` token equivalents in `AISearchBar.tsx`
- [x] All `purple-*` color classes replaced in `AIFilterTags.tsx`
- [x] All `purple-*` color classes replaced in `PlayerDirectoryClient.tsx` (AI-related only)
- [x] `text-purple-700` replaced with `text-foreground-muted` in `NotificationItem.tsx` and `NotificationList.tsx`
- [x] `grep -r "purple" src/` returns zero matches (all purple eliminated from codebase)
- [x] History dropdown items have visible hover state (`bg-elevated`)
- [x] History chips have visible hover state (`bg-elevated`)
- [x] Error message uses `text-danger` token (not hardcoded `text-red-600`)
- [x] Empty state clear button visible in both light and dark mode
- [x] Search input has perceptible green tint (`bg-primary/[0.06]`) in both themes
- [x] AI filter tags are green pills with readable text (check dark mode at 11px)
- [x] Tag remove buttons use `text-primary/50` (AA contrast compliant)
- [x] "AI Search" label text is green (not purple)
- [x] Loading spinner uses green accent
- [x] Unmount abort cleanup added (prevents orphaned fetch requests)
- [x] Both light and dark mode correct
- [x] Mobile responsive at 375px+
- [x] Both en/ka translations verified
- [x] `npm run build` passes
- [x] No changes to AI search API routes, service, or prompt
- [x] No changes to search history logic
- [x] Feature gate (`NEXT_PUBLIC_AI_SEARCH_ENABLED`) still works

## Dependencies & Risks

**Dependencies:**
- Sessions 1-4 must be complete (A3 palette tokens, ThemeProvider, player browse layout)
- `NEXT_PUBLIC_AI_SEARCH_ENABLED=true` must be set in `.env.local` for testing

**Risks:**
- **Minimal risk** — this is a color swap with 1 minor logic addition (3-line abort cleanup)
- **Green-on-green conflict** — AI filter tags (green pills) sit above FilterPanel chips. Architecture review confirmed: AI tags are `bg-primary/10 text-primary` (prominent) while regular chips are `bg-surface text-foreground-muted` (neutral) + FilterPanel is dimmed during AI mode (opacity-40). Sufficient distinction via sparkle icon, "AI Search:" label, and visual hierarchy.
- **Input tint visibility** — `bg-primary/[0.06]` should be perceptible. If not on tester's monitor, bump to `/[0.08]`. The border is the primary cue.
- **Filter tag dark mode readability** — 11px text on `bg-primary/10` in dark mode. Verify, bump to `/15` if needed.

## Future Work (Deferred from Research)

Issues discovered by review agents that are **out of scope** for this session but worth tracking:

### Frontend Race Conditions (Races Reviewer — ~15 lines total fix)
1. `isSearching` stale closure in `handleSearch` — reads state snapshot, not current value. Use a ref for the guard. **Medium priority.**
2. `clearTimeout` skipped when `abort()` triggered externally — zombie timeout fires on already-aborted request. **Low priority.**
3. History fetch on mount has no unmount cleanup — wasted work if component unmounts fast. **Low priority.**

### Security Hardening (Security Sentinel — all low severity)
1. Rate limit bypass on re-query path — tag removal re-queries API without rate limit check. Currently fine (skips Claude), but could be used for DB query abuse.
2. Prompt injection defense-in-depth — the `parseSearchQuery` function passes user input directly to Claude. Zod validation on output catches structural issues, but input sanitization would add a defense layer.
3. `.or()` filter construction in API route uses string interpolation — minor PostgREST injection vector (mitigated by `escapePostgrestValue` but not airtight).

### TypeScript Debt (TypeScript Reviewer)
- `AISearchResponse.players` typed as `Array<Record<string, unknown>>` — root cause of the 30-line `mapAIPlayerToCard` function. Properly typing the API response would eliminate brittle mapping code. Standalone refactor task.

### Performance (Performance Oracle — Phase 8 items)
- Post-filter pattern fetches up to 50 players then filters skills/stats in JS. Fine at current scale, but a stored function would be better at 500+ players.
- `season_stats` array sorted repeatedly during filtering and sorting. Extract latest stat once per player before filtering.

### Broader `text-red-600` Hardcoding (Pattern Recognition)
- `text-red-600` appears in 15+ files across the codebase. The fix in this session (AISearchBar) is one instance. A codebase-wide migration to `text-danger` is a separate cleanup task.

## Sources & References

- **Design spec:** `docs/superpowers/specs/2026-03-16-frontend-redesign-design.md` — Moment 2 (lines 332-340), Color System (lines 40-104)
- **Session 4 plan:** `docs/plans/2026-03-16-refactor-frontend-redesign-session-4-player-browse-plan.md` — browse layout context
- **Current AISearchBar:** `src/components/player/AISearchBar.tsx` — 321 lines, purple accent
- **Current AIFilterTags:** `src/components/player/AIFilterTags.tsx` — 143 lines, purple accent
- **Current client wrapper:** `src/components/player/PlayerDirectoryClient.tsx` — AI state management
- **AI search types:** `src/lib/ai-search/types.ts` — Zod schema (untouched)
- **Translations:** `src/lib/translations/players.ts` — all AI search keys exist (no additions needed)
- **globals.css:** `src/app/globals.css` — A3 tokens, `@theme inline` bridge
- **Learnings:** `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` — tinted-transparent pattern, WCAG contrast checklist, dual-theme rules
- **Learnings:** `docs/solutions/ui-bugs/transfer-page-premium-redesign-and-rpc-fix.md` — position border preservation, notification component patterns
