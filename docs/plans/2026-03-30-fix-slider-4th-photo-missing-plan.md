---
title: Fix Hero Slider 4th Photo Not Displaying
type: fix
status: active
date: 2026-03-30
---

# Fix Hero Slider 4th Photo Not Displaying

## Overview

Giorgi Cereteli (4th player in hero slider) photo reportedly not showing. Investigation reveals **no code-level bug** — the file exists (`public/images/landing/slider-4.jpg`, 555KB, 1599x1599px), DEMO_SLIDER_PLAYERS has all 4 entries, and HeroPlayerSlider renders all players via `.map()` without filtering.

## Root Cause Analysis

**Code is correct.** The issue is almost certainly one of:

1. **Stale `.next` cache** — old build cache doesn't have the image optimized
2. **Browser cache** — browser cached a 404 from before the file was added
3. **Dev server not restarted** after adding the image file
4. **Next.js Image optimization** — the `/_next/image` proxy might not have picked up the new file

## Fix Steps

### Step 1: Clear caches and rebuild

```bash
rm -rf .next
npm run dev
```

### Step 2: Verify in browser

1. Open `http://localhost:3000`
2. Wait for slider to cycle to 4th slide (or click dot 4)
3. Open DevTools → Network tab → filter by "slider-4"
4. Verify the image loads with 200 status (not 404 or broken)

### Step 3: If still broken — check browser console

- Look for Next.js Image errors (wrong dimensions, missing loader, etc.)
- Hard refresh with `Ctrl+Shift+R` to bypass browser cache

### Step 4: If STILL broken — fallback to unoptimized

As a last resort, temporarily use `<img>` instead of `<Image>` for debugging, or add `unoptimized` prop to the Image component for slider-4.

## Acceptance Criteria

- [ ] All 4 slider photos display correctly on landing page
- [ ] Slider auto-rotates through all 4 players
- [ ] 4th dot indicator highlights when Cereteli's slide is active
- [ ] Works in both light and dark mode

## Context

- **Where the user might see the issue:** Either on landing page slider OR on `/players/giorgi-cereteli` profile page
- **Landing slider:** `src/components/landing/HeroPlayerSlider.tsx` — uses `next/image` with `fill` + `object-cover`
- **Player profile:** `src/app/(platform)/players/[slug]/page.tsx` — also uses `next/image`
- **Data source:** Static `DEMO_SLIDER_PLAYERS` array in `src/app/(public)/page.tsx`
- **DB record:** `photo_url: "/images/landing/slider-4.jpg"` for the player profile page
