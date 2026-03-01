---
title: "feat: Advanced Player Directory Filters"
type: feat
status: completed
date: 2026-02-27
---

# Advanced Player Directory Filters

## Overview

Replace the basic single-select filters on the player directory page with advanced multi-select and range-based filters. Scouts should be able to combine multiple positions, age ranges, clubs, foot preference, and height ranges to precisely narrow down player results.

## Problem Statement

Current filters are limited: single position, predefined age buckets (U16/U17/U18/U19/19+), single club, single foot. A scout looking for "left-footed midfielders or wingers aged 16-18 at Torpedo or Dinamo" can't express this query. Multi-select and range filters solve this.

## Current State (from research)

| Filter | Current | URL Param | Query Type |
|--------|---------|-----------|------------|
| Position | Single chip toggle | `?position=MID` | `.eq('position', val)` |
| Age | Predefined bucket dropdown | `?age=u17` | Client-side via `calculateAge()` |
| Club | Single dropdown | `?club=uuid` | `.eq('club_id', val)` |
| Foot | Single dropdown | `?foot=Left` | `.eq('preferred_foot', val)` |
| Height | Not available | — | — |

**Key files:**
- `src/components/forms/FilterPanel.tsx` — client component, all filter UI
- `src/app/(platform)/players/page.tsx` — server component, query building + pagination
- `src/lib/constants.ts` — `POSITIONS`, `AGE_RANGES`, `PREFERRED_FEET`
- `src/lib/translations.ts` — filter labels (en + ka)

## Proposed Solution

### 1. Age Range Filter (two dropdowns)

**Replace** the predefined `AGE_RANGES` dropdown with two dropdowns: Min Age / Max Age.

- **URL params:** `?age_min=16&age_max=18` (replaces `?age=u17`)
- **Default range:** 14-21 (shown as placeholder text, not pre-selected)
- **Dropdown values:** 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
- **Filtering:** Still client-side via `calculateAge()` — age is computed from `date_of_birth`
- **Validation:** If `age_min > age_max`, swap them silently. If only one is set, filter as >= or <= accordingly.

**Changes:**
- `FilterPanel.tsx`: Replace age `<select>` with two `<select>` dropdowns (Min Age / Max Age), narrower width
- `page.tsx`: Replace `AGE_RANGE_MAP` lookup with direct `age_min`/`age_max` number parsing; update `needsClientPagination` to check for either param; update age filtering logic
- `constants.ts`: Add `AGE_MIN_DEFAULT = 14`, `AGE_MAX_DEFAULT = 25`, `AGE_OPTIONS` array
- `translations.ts`: Add `players.ageMin`, `players.ageMax` keys (en + ka)
- Remove `AGE_RANGES` and `AGE_RANGE_MAP` from constants (no longer used)

### 2. Multi-Position Filter (multi-select chips)

**Upgrade** position chips from single-toggle to multi-select.

- **URL param:** `?position=MID,WNG` (comma-separated)
- **UI:** Same chip buttons, but multiple can be active simultaneously
- **Query:** `.in('position', ['MID', 'WNG'])` — always use `.in()`, works for single values too
- **Clear:** Clicking an active chip removes it from the list; if last chip is removed, param is deleted

**Changes:**
- `FilterPanel.tsx`: Change position chip click handler — toggle in/out of comma-separated string instead of replacing
- `page.tsx`: Split `position` param by comma, always use `.in()`

### 3. Multi-Club Filter (multi-select chips)

**Upgrade** club filter to multi-select chips (same pattern as positions).

- **URL param:** `?club=uuid1,uuid2` (comma-separated)
- **UI:** Club name chips, same toggle behavior as position chips. With only 3 clubs, chips are simpler and more consistent than a custom dropdown.
- **Query:** `.in('club_id', ['uuid1', 'uuid2'])` — always use `.in()`
- **Bilingual:** Chip labels use `lang === 'ka' ? club.name_ka : club.name`

**Changes:**
- `FilterPanel.tsx`: Replace club `<select>` with club chips row (same pattern as position chips, but colored uniformly)
- `page.tsx`: Split `club` param by comma, always use `.in()`

### 4. Height Range Filter (advanced, expandable)

**New filter** behind an "Advanced Filters" toggle.

- **URL params:** `?height_min=170&height_max=185`
- **UI:** Two small dropdowns (Min Height / Max Height) inside a collapsible "Advanced Filters" section. Section auto-expands if height params are in the URL.
- **Dropdown values:** 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200 (5cm increments)
- **Query:** DB-level — `.gte('height_cm', min).lte('height_cm', max)` (no client-side needed!)
- **Note:** Players with `null` height_cm are excluded from results when height filter is active (standard Supabase behavior)

**Changes:**
- `FilterPanel.tsx`: Add collapsible "Advanced Filters" section with height dropdowns; track open/closed state
- `page.tsx`: Parse `height_min`/`height_max` params; apply `.gte()` / `.lte()` to query
- `constants.ts`: Add `HEIGHT_OPTIONS` array (150-200 in 5cm steps)
- `translations.ts`: Add `players.heightMin`, `players.heightMax`, `players.advancedFilters` keys

## Acceptance Criteria

### Age Range
- [x] Two dropdowns (Min Age / Max Age) replace the old age bucket dropdown
- [x] URL params: `?age_min=16&age_max=18`
- [x] Works with client-side filtering via `calculateAge()`
- [x] Single-sided filtering works (only min or only max)
- [x] Invalid range (min > max) handled gracefully

### Multi-Position
- [x] Multiple position chips can be active simultaneously
- [x] URL param: `?position=MID,WNG` (comma-separated)
- [x] Query uses `.in('position', [...])` always
- [x] Toggling a chip adds/removes from list

### Multi-Club
- [x] Club name chips (same pattern as position chips)
- [x] URL param: `?club=uuid1,uuid2` (comma-separated)
- [x] Bilingual chip labels (en/ka)
- [x] Query uses `.in('club_id', [...])` always

### Height Range
- [x] Collapsible "Advanced Filters" section (auto-expands if height params in URL)
- [x] Two dropdowns (Min Height / Max Height) in 5cm increments
- [x] URL params: `?height_min=170&height_max=185`
- [x] DB-level filtering (no client-side pagination needed)
- [x] Players with null height excluded when filter active

### Combined Filters
- [x] All filters combine correctly: `?position=MID,WNG&age_min=16&age_max=18&foot=Left&club=uuid1,uuid2&height_min=170`
- [x] "Clear Filters" clears all params including new ones
- [x] Pagination preserves all filter params
- [x] `hasFilters` check includes all new params

### Housekeeping
- [x] All new strings have en + ka translations
- [x] `PlayersPageProps.searchParams` type updated with new params
- [x] `pageUrl()` function preserves all new params
- [x] `needsClientPagination` correctly identifies age range filters
- [x] Old `AGE_RANGES` / `AGE_RANGE_MAP` constants removed
- [x] `npm run build` passes clean

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Age filter UI | Two dropdowns (not slider) | Simpler, accessible, no extra dependency, consistent with existing select pattern |
| Multi-club UI | Chips (same as positions) | Only 3 clubs — chips are simpler, consistent, no custom component needed |
| Height filter visibility | Collapsible "Advanced" section | Keeps main filter bar clean; height is niche for most scouts |
| Height filter approach | DB-level `.gte()/.lte()` | Column exists directly, no computed value — much more efficient than client-side |
| Remove AGE_RANGES | Yes | No longer needed with freeform min/max; avoids dead code |
| Foot filter changes | None | Already works correctly with Left/Right/Both/All |
| `.eq()` vs `.in()` | Always `.in()` | `.in(['X'])` works same as `.eq('X')` — one code path, no branching |
| Old `?age=u17` URLs | Accept the break | No users have bookmarked filters yet; clean break is simpler than compat shim |
| Advanced section expand | Auto-expand if params in URL | Users must see their active filters |

## Implementation Order

1. **Constants + Translations** — Add new constants, translation keys, remove old age ranges
2. **FilterPanel.tsx** — All UI changes (age dropdowns, multi-position, multi-club, height section)
3. **page.tsx** — Update query building, pagination, searchParams type, pageUrl()
4. **Test all combinations** — Build passes, filters combine correctly
