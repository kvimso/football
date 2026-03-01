---
title: "Transfer Page Premium Redesign"
date: "2026-03-01"
status: completed
---

# Transfer Page Premium Redesign

## Design Direction
Compact premium dashboard with glass-morphism cards, position-colored accents, and micro-animations. Separate tabs for Incoming/Outgoing. Everything feels like a luxury financial terminal meets football manager.

## Implementation Steps

### 1. Add CSS utilities for glass-morphism and transfer animations
- [x] Add `.glass-card` class to `globals.css` — `bg-white/[0.03] backdrop-blur-sm border border-white/[0.06]`
- [x] Add `.glass-card-active` for pending items — slightly brighter glow
- [x] Add `@keyframes transfer-slide-in` — staggered card entrance animation
- [x] Add transfer progress bar gradient utility

### 2. Create TransferCard client component
- [x] New file: `src/components/admin/TransferCard.tsx`
- [x] Props: player name, position, platform_id, club name, direction (incoming/outgoing), status, requested_at, requestId (for actions)
- [x] Position-colored thick left accent bar using `POSITION_COLOR_CLASSES` border variants
- [x] Directional arrow inline: `←` for incoming, `→` for outgoing
- [x] For pending: show countdown progress bar (7-day expiry calculation), round icon buttons `[✓]` `[✗]`
- [x] For completed: show status badge with icon (checkmark/x/clock)
- [x] Glass-morphism card styling with hover elevation
- [x] Stagger animation via `style={{ animationDelay }}` prop

### 3. Create TransferTabs client component
- [x] New file: `src/components/admin/TransferTabs.tsx`
- [x] Segment control: `[↓ Incoming (count)]` `[↑ Outgoing (count)]`
- [x] Active tab has accent background, inactive is muted
- [x] Renders the appropriate list of TransferCard components
- [x] Smooth content transition on tab switch

### 4. Redesign admin/transfers/page.tsx (server component)
- [x] Compact header: transfer icon + title + pending count with pulsing dot — all in one clean bar, NOT a big card
- [x] Search section integrated below header (not a separate card — part of the main container)
- [x] Pass incoming/outgoing data to TransferTabs client component
- [x] Remove old two-column layout, section-header cards, etc.

### 5. Polish TransferSearch component
- [x] Glass-morphism styling on the search container
- [x] Search icon in input field
- [x] Result cards use same glass + position-accent style as TransferCard
- [x] Loading spinner on search button
- [x] Collapse search results area when empty (no big empty state box)

### 6. Polish TransferActions → merge into TransferCard
- [x] Round icon-only buttons: green circle `✓`, red circle `✗`
- [x] Tooltip on hover showing "Accept" / "Decline"
- [x] Loading state: spinning border on the circle
- [x] Keep TransferActions as a sub-component used by TransferCard

### 7. Build and verify
- [x] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Test on mobile (375px+) — tabs stack, cards remain readable
- [ ] Verify bilingual (en/ka) renders correctly

## Key Files
- `src/app/globals.css` — new glass + animation utilities
- `src/components/admin/TransferCard.tsx` — NEW
- `src/components/admin/TransferTabs.tsx` — NEW
- `src/components/admin/TransferSearch.tsx` — EDIT
- `src/components/admin/TransferActions.tsx` — EDIT
- `src/app/admin/transfers/page.tsx` — REWRITE

## Translation Keys Needed
- `admin.transfers.daysLeft` — "{days} days left" / "{days} დღე დარჩა"
- `admin.transfers.expired` already exists
- All other keys already exist

## Design Tokens
- Glass card: `bg-white/[0.03] backdrop-blur-sm border-white/[0.06]`
- Glass card hover: `hover:bg-white/[0.06] hover:border-white/[0.1]`
- Glass card pending: `bg-white/[0.05] border-accent/20`
- Position border: reuse `POSITION_BORDER_CLASSES` from constants but for `border-l`
- Progress bar: `bg-gradient-to-r from-accent to-accent/50`
