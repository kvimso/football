# About Page Features Section — Polish Spec

**Date:** 2026-04-02
**Status:** Approved
**Component:** `src/components/about/AboutFeatures.tsx`
**Mockup:** `.superpowers/brainstorm/37961-1775138083/content/features-final-v5.html`

---

## Summary

Polish the "What you get" features section on the About page. No layout changes — same 4-card bento grid (2 large + 2 small). Changes are purely visual: remove dashed borders, add fading title underlines, make the dark card stand out, replace badge pills with minimal audience labels.

---

## Changes Required

### 1. Remove green dashed borders from all cards

The current cards use `border border-white/[0.06]` which renders as a visible dashed/dotted outline. Replace with a subtle solid border.

**Light cards:**
```css
background: var(--surface);        /* #1C1A17 in dark mode */
border: 1px solid var(--border);   /* rgba(238,236,232,0.06) — barely visible solid */
border-radius: 16px;
```

**Dark card (Player Comparison):**
```css
background: linear-gradient(155deg, #141310 0%, #0A0908 100%);
border: 1px solid rgba(74,222,128,0.08);
border-radius: 16px;
```

### 2. Add fading green underline on every card title

Every feature card title gets a short gradient line underneath that fades from green to transparent.

```css
/* On the title element — position: relative; display: inline-block */
.title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, var(--primary), transparent);
  border-radius: 2px;
  opacity: 0.5;
}
/* Dark card variant: opacity: 0.6 */
```

### 3. Corner gradient ONLY on the dark comparison card

Remove any corner/decorative effects from light cards. The dark card gets:

```css
/* Corner gradient slice — top right */
.dark-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 140px;
  height: 140px;
  background: linear-gradient(135deg, rgba(74,222,128,0.06) 0%, transparent 55%);
  pointer-events: none;
}

/* Blue glow orb — bottom left */
.dark-card::after {
  content: '';
  position: absolute;
  bottom: -40px;
  left: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%);
  pointer-events: none;
}
```

Light cards get NO decorative pseudo-elements.

### 4. Replace badge pills with minimal audience labels

Remove the current green badge pills ("FOR SCOUTS", "BOTH"). Replace with a subtle dot + text label.

**Before:**
```html
<span class="badge bg-primary/15 text-primary">FOR SCOUTS</span>
```

**After:**
```html
<div class="audience">
  <div class="dot"></div>
  Scouts
</div>
```

```css
.audience {
  margin-top: 1rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--foreground-faint);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.audience .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--primary);
}
```

**Audience labels per card:**
- Advanced Player Search → `Scouts`
- Trending Players → `Scouts`
- Scout-Academy Chat → `Scouts & Academies`
- Player Comparison → `Scouts`

### 5. Hover effects

```css
/* Light cards */
.light:hover {
  transform: translateY(-3px);
  border-color: rgba(238,236,232,0.12);
  box-shadow: 0 12px 32px -8px rgba(0,0,0,0.25);
}

/* Dark card */
.dark:hover {
  transform: translateY(-3px);
  border-color: rgba(74,222,128,0.2);
  box-shadow: 0 12px 40px -8px rgba(74,222,128,0.08);
}
```

### 6. Visual mockup areas (large cards)

The visual containers inside the two large cards:

**Light (Search) visual:**
```css
background: rgba(255,255,255,0.02);
border: 1px solid var(--border);
border-radius: 12px;
```

**Dark (Comparison) visual:**
```css
background: rgba(74,222,128,0.02);
border: 1px solid rgba(74,222,128,0.06);
border-radius: 12px;
```

### 7. Improved radar chart SVG (dark card)

Replace the current RadarChart component with a cleaner version:
- 3 concentric hexagonal grid rings (not 2)
- 3 axis lines through center
- Vertex dots (2.5px radius, `rgba(74,222,128,0.25)`) at each hexagon corner
- Center dot (2px, `rgba(255,255,255,0.12)`)
- Player A polygon: `fill: rgba(74,222,128,0.08)`, `stroke: #4ADE80`, `stroke-width: 1.5`
- Player B polygon: `fill: rgba(96,165,250,0.05)`, `stroke: #60A5FA`, `stroke-width: 1.5`, `stroke-dasharray: 5,4`
- Labels: `font-size: 7`, `fill: rgba(238,236,232,0.25)` — PAC, SHO, PAS, DEF, PHY, DRI

---

## What NOT to change

- Grid layout (3-col, 2 rows, same span pattern)
- Card content (titles, descriptions, icons)
- Section header ("Platform Capabilities" / "What you get")
- SVG icons inside icon boxes
- Search mockup content (pills, input)
- i18n keys
- Mobile responsive behavior
