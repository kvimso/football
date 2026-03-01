---
title: "Filter Panel Redesign: Floating Filter Dock"
date: "2026-03-01"
status: active
component: FilterPanel
affected_files:
  - src/components/forms/FilterPanel.tsx
  - src/components/forms/FilterPopover.tsx (new)
  - src/app/globals.css
  - src/lib/constants.ts
  - src/lib/translations.ts
---

# Filter Panel Floating Dock Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat, generic player directory filter panel with a premium glass-morphism "Floating Filter Dock" — a single glass container with position-colored glow chips, smart trigger-pill popovers, and an active filter summary strip.

**Architecture:** The `FilterPanel.tsx` component gets a complete rewrite. A new reusable `FilterPopover.tsx` component handles outside-click/escape-key closing (same pattern as `PlayerActionsMenu.tsx`). All existing filter logic (URL search params, multi-select, debounced search) is preserved. New `POSITION_GLOW_CLASSES` constant added. New i18n keys for trigger pill labels.

**Tech Stack:** React (client component), Tailwind CSS v4 with CSS custom properties, Next.js App Router `useSearchParams`

---

## Task 1: Create `FilterPopover` reusable component

**Files:**
- Create: `src/components/forms/FilterPopover.tsx`

**Reference pattern:** `src/components/admin/PlayerActionsMenu.tsx:23-42` — outside-click + escape-key closing

**Step 1: Create FilterPopover.tsx**

```tsx
'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'

interface FilterPopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function FilterPopover({ trigger, children, align = 'left' }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full z-30 mt-2 min-w-[200px] rounded-xl border border-white/[0.08] bg-[#1a2420] p-3 shadow-xl shadow-black/30 animate-slide-in-down ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: PASS (component exists but isn't imported anywhere yet)

---

## Task 2: Add `POSITION_GLOW_CLASSES` to constants

**Files:**
- Modify: `src/lib/constants.ts` (after `POSITION_LEFT_BORDER_CLASSES` at line 32)

**Step 1: Add the constant**

Add after line 32 (`}`):

```typescript
export const POSITION_GLOW_CLASSES: Record<Position, string> = {
  GK: 'bg-pos-gk/20 text-pos-gk border-pos-gk/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
  DEF: 'bg-pos-def/20 text-pos-def border-pos-def/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
  MID: 'bg-pos-mid/20 text-pos-mid border-pos-mid/30 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
  ATT: 'bg-pos-att/20 text-pos-att border-pos-att/30 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
  WNG: 'bg-pos-wng/20 text-pos-wng border-pos-wng/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
  ST: 'bg-pos-st/20 text-pos-st border-pos-st/30 shadow-[0_0_8px_rgba(239,68,68,0.15)]',
}
```

---

## Task 3: Add i18n keys for trigger pill labels

**Files:**
- Modify: `src/lib/translations.ts`

**Step 1: Add new English keys** (inside `en.players` object, after `advancedFilters` at ~line 102):

```typescript
      stats: 'Stats',
      sort: 'Sort',
      filterClub: 'Club',
      filterAge: 'Age',
      filterFoot: 'Foot',
      filterStatus: 'Status',
      physical: 'Physical',
      performance: 'Performance',
      activeFilters: '{count} active',
      clearAll: 'Clear All',
```

**Step 2: Add corresponding Georgian keys** (inside `ka.players` object, after `advancedFilters`):

```typescript
      stats: 'სტატისტიკა',
      sort: 'სორტირება',
      filterClub: 'კლუბი',
      filterAge: 'ასაკი',
      filterFoot: 'ფეხი',
      filterStatus: 'სტატუსი',
      physical: 'ფიზიკური',
      performance: 'მაჩვენებლები',
      activeFilters: '{count} აქტიური',
      clearAll: 'ყველას გასუფთავება',
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS

---

## Task 4: Rewrite FilterPanel.tsx — Glass container + Search bar + Position chips

**Files:**
- Modify: `src/components/forms/FilterPanel.tsx` (complete rewrite)

This is the core task. Rewrite the entire component with:

**Outer container:** Glass-morphism wrapper
```tsx
<div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm space-y-4">
```

**Search bar:** Glass-embedded with accent icon
```tsx
<div className="relative">
  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/50" .../>
  <input
    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-foreground-muted/60 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(16,185,129,0.08)]"
    ...
  />
</div>
```

**Position chips:** Use `POSITION_GLOW_CLASSES` for active state, glass inactive
```tsx
<button
  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
    isActive
      ? POSITION_GLOW_CLASSES[pos as Position]
      : 'border-white/[0.08] bg-white/[0.04] text-foreground-muted hover:bg-white/[0.08] hover:text-foreground'
  }`}
>
```

**Preserve all existing logic:** `updateParam`, `toggleMultiParam`, `debouncedSearch`, `clearFilters`, `searchParams` reading. These are **unchanged**.

---

## Task 5: Add trigger pills row with FilterPopover for each filter group

**Files:**
- Modify: `src/components/forms/FilterPanel.tsx` (continued)

Replace the old `FilterSelect` dropdowns and club chips with trigger pills that use `FilterPopover`:

**Trigger pill component** (inline in FilterPanel):

```tsx
function TriggerPill({ icon, label, value, hasValue }: { icon: ReactNode; label: string; value: string; hasValue: boolean }) {
  return (
    <button className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
      hasValue
        ? 'border-accent/20 bg-accent/8 text-accent'
        : 'border-white/[0.08] bg-white/[0.04] text-foreground-muted hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-foreground'
    }`}>
      {icon}
      <span>{value || label}</span>
      <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
      </svg>
    </button>
  )
}
```

**6 trigger pills in a flex row:**

1. **Club** — popover contains club chips (multi-select, same toggle logic)
   - Value display: comma-separated club names, or "Club" if none
2. **Age** — popover contains age min/max + height min/max + weight min/max glass selects
   - Value display: "14 – 21" if age set, or count of active physical filters
3. **Foot** — popover contains 3 clickable options (Left/Right/Both)
   - Value display: selected foot name, or "Foot"
4. **Stats** — popover contains goals/assists/matches/pass acc glass selects
   - Value display: "{n} active" count, or "Stats"
5. **Sort** — popover contains sort option list
   - Value display: current sort label, or "Sort"
6. **Status** — popover contains status option list
   - Value display: current status label, or "Status"

**Glass selects inside popovers:**

```tsx
<select className="w-full rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent/40">
```

---

## Task 6: Add active filter summary strip

**Files:**
- Modify: `src/components/forms/FilterPanel.tsx` (continued)

At the bottom of the glass container, conditionally render a summary strip when any filters are active.

```tsx
{hasFilters && (
  <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
    {/* Position tags */}
    {activePositions.map(pos => (
      <span key={pos} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
        {t(`positions.${pos}`)}
        <button onClick={() => toggleMultiParam('position', pos, activePositions)} className="ml-0.5 hover:text-foreground">✕</button>
      </span>
    ))}
    {/* Club tags */}
    {activeClubs.map(clubId => {
      const c = clubs.find(c => c.id === clubId)
      return c ? (
        <span key={clubId} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
          {lang === 'ka' ? c.name_ka : c.name}
          <button onClick={() => toggleMultiParam('club', clubId, activeClubs)} className="ml-0.5 hover:text-foreground">✕</button>
        </span>
      ) : null
    })}
    {/* Age tag */}
    {(ageMin || ageMax) && (
      <span className="...">Age: {ageMin || '?'}–{ageMax || '?'} <button onClick={() => { updateParam('age_min', ''); updateParam('age_max', '') }}>✕</button></span>
    )}
    {/* ... similar for foot, height, weight, stats */}

    {/* Clear All */}
    <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10">
      {t('players.clearAll')}
    </button>
  </div>
)}
```

---

## Task 7: Verify build + cleanup

**Step 1: Run build**

Run: `npm run build`
Expected: PASS with zero TypeScript errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (or only pre-existing warnings)

**Step 3: Manual verification checklist**

- [ ] Glass container has depth and backdrop blur
- [ ] Search bar has accent icon and focus glow
- [ ] Position chips glow in their position color when active
- [ ] Each trigger pill opens a glass popover on click
- [ ] Popovers close on outside click and Escape
- [ ] Trigger pills show current value when filter is active
- [ ] Active filter summary shows removable tags
- [ ] Clear All removes all filters
- [ ] All filters still update URL search params correctly
- [ ] Mobile: trigger pills wrap, popovers render correctly
- [ ] i18n: switch to Georgian — all labels translate

**Step 4: Commit**

```bash
git add src/components/forms/FilterPanel.tsx src/components/forms/FilterPopover.tsx src/lib/constants.ts src/lib/translations.ts
git commit -m "feat(filters): redesign player filter panel with glass-morphism floating dock

Replace flat filter panel with premium glass container, position-colored
glow chips, smart trigger-pill popovers, and active filter summary strip.

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Implementation Steps (checkboxes)

- [ ] 1. Create `FilterPopover` component
- [ ] 2. Add `POSITION_GLOW_CLASSES` to constants
- [ ] 3. Add i18n keys for trigger pills (en + ka)
- [ ] 4. Rewrite `FilterPanel` — glass container + search + position chips
- [ ] 5. Add trigger pills row with 6 popovers (club, age/physical, foot, stats, sort, status)
- [ ] 6. Add active filter summary strip with removable tags
- [ ] 7. Build verification + lint + cleanup
