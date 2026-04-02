---
title: Contact Page V2 — Dark Form Card + Help Tiles
type: feat
status: completed
date: 2026-04-02
origin: docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md
---

# Contact Page V2 — Dark Form Card + Help Tiles

## Overview

Update the contact page (implemented in `8be04ba`) to match the revised spec: dark-themed form card, gradient divider, "How Can We Help?" icon tile grid with integrated partner footer. Replaces the light form card, standalone Partner Strip, and FAQ/CTA section.

## Problem Statement / Motivation

The current implementation uses a light `bg-surface` form card, a standalone Partner Strip (Starlive + Pixellot), and a FAQ/CTA section with a "Professional Demo" highlight. The updated spec calls for a more visually striking dark form card with green glow effects, a gradient divider, and a reorganized "How Can We Help?" section with 2×2 icon tiles and an integrated partner footer (Starlive + Free Football Agency).

## Proposed Solution

### Phase 1: ContactForm Dark Restyle

Modify `src/components/contact/ContactForm.tsx` (client component):

**New visual wrapper (in ContactSplit, not ContactForm itself):**
- Replace `bg-surface` card with dark gradient: `linear-gradient(155deg, #1A1917 0%, #12110F 100%)`
- Border: `1px solid rgba(255,255,255,0.06)`, `border-radius: 14px`
- Padding: `40px` desktop / `28px` mobile
- Green glow orb: `radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)`, 250px, positioned `top: -80px; right: -80px`, overflow hidden

**Header row (inside ContactForm):**
- Left: `"Send us a message"` via `t('contact.formTitle')` — `18px`, `font-weight: 800`, `#EEECE8`
- Right: `"24h Response"` badge via `t('contact.formBadge')` — pill with green text/border on dark bg

**Input restyling (all hardcoded dark — always on dark card):**
- Labels: `rgba(238,236,232,0.35)`, `10px uppercase`
- Inputs: `bg: rgba(255,255,255,0.04)`, `border: rgba(255,255,255,0.08)`, `color: #EEECE8`
- Focus: `border: rgba(74,222,128,0.3)`, `bg: rgba(255,255,255,0.06)`, green ring
- Placeholder: `rgba(238,236,232,0.4)`

**Submit button:**
- `bg: #4ADE80`, `color: #0A0908` (dark text on bright green)
- `border-radius: 10px`, `padding: 14px`
- Hover: `bg: #3ECF74`, `translateY(-1px)`, shadow intensifies

**Privacy footer (below submit):**
- `border-top: 1px solid rgba(255,255,255,0.06)`, `margin-top: 20px`, `padding-top: 16px`
- Lock icon (14px, `#4ADE80`) + privacy text (`11px`, `rgba(238,236,232,0.3)`)

**Success state (dark bg):**
- Green check on dark background, white/light text instead of `text-foreground`

**Error state:**
- Restyle for dark background — red border + red text still visible

**Files:**
- `src/components/contact/ContactForm.tsx` (modify)

### Phase 2: ContactSplit Dark Card Wrapper

Update `src/components/contact/ContactSplit.tsx`:
- Replace `bg-surface` card div with dark gradient wrapper + green glow orb
- Add `overflow: hidden`, `position: relative` for glow containment
- Keep image column unchanged

**Files:**
- `src/components/contact/ContactSplit.tsx` (modify)

### Phase 3: Replace Partners + FAQ with Help + Divider

**Delete:**
- `src/components/contact/ContactPartners.tsx`
- `src/components/contact/ContactFAQ.tsx`

**Create `src/components/contact/ContactHelp.tsx`** (server component):
- Centered header: green dash + "How Can We Help?" heading (serif) + subtitle
- 2×2 tile grid: `grid-template-columns: repeat(2, 1fr)`, `gap: 16px`
  - Each tile: `bg-surface`, `rounded-[14px]`, `p-8`, `border: 1px solid rgba(0,0,0,0.02)`
  - Horizontal layout: icon box (44×44, rounded-xl, green bg) + text
  - Hover: `box-shadow: 0 4px 20px rgba(0,0,0,0.04)`
  - Title + description + "Learn more →" / "Request demo →" / "Press kit →" link
- On mobile: single column tiles
- Partner footer integrated at bottom:
  - `border-top: 1px solid var(--border)`, centered
  - Label: "Strategic Partners" + logos: **STARLIVE** + **FREE FOOTBALL AGENCY** at `opacity: 0.3`
  - Decorative only

**Add gradient divider** (inline in `page.tsx` or small component):
- `max-width: 1200px`, centered
- `height: 1px`, `background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent)`

**Files:**
- `src/components/contact/ContactPartners.tsx` (delete)
- `src/components/contact/ContactFAQ.tsx` (delete)
- `src/components/contact/ContactHelp.tsx` (new)

### Phase 4: Translation Updates

**New keys to add (en + ka):**
```
contact.formTitle      — "Send us a message" / "მოგვწერეთ"
contact.formBadge      — "24h Response" / "24 სთ პასუხი"
contact.privacy        — "Your data is encrypted..." / "თქვენი მონაცემები დაშიფრულია..."
contact.helpHeading    — "How Can We Help?" / "როგორ დაგეხმაროთ?"
contact.helpSubtitle   — "Choose a topic or send us..." / "აირჩიეთ თემა ან..."
```

**Keys to rename** (faq → tile, different content):
```
contact.faq0Title → contact.tile0Title  — "Academy Partnerships"
contact.faq0Desc  → contact.tile0Desc   — "We digitize local talent..."
+ contact.tile0Link — "Learn more"
contact.faq1Title → contact.tile1Title  — "Scouting & Platform Access"
contact.faq1Desc  → contact.tile1Desc   — "Verified data on Georgian youth..."
+ contact.tile1Link — "Request demo"
contact.faq2Title → contact.tile2Title  — "Camera Technology"
contact.faq2Desc  → contact.tile2Desc   — "Through our partner Starlive..."
+ contact.tile2Link — "Learn more"
contact.faq3Title → contact.tile3Title  — "Media & Press"
contact.faq3Desc  → contact.tile3Desc   — "For press, interviews..."
+ contact.tile3Link — "Press kit"
```

**Keys to update:**
- `contact.partnersLabel` — "Strategic Technical Partners" → "Strategic Partners"

**Keys to remove** (no longer used):
- `contact.demoTitle`, `contact.demoDesc`, `contact.demoLink`
- `contact.faq0Title` through `contact.faq3Desc` (replaced by tile keys)

**Files:**
- `src/lib/translations/landing.ts` (modify en + ka sections)

### Phase 5: Page Assembly

Update `src/app/(shared)/contact/page.tsx`:
- Replace `ContactPartners` + `ContactFAQ` imports with `ContactHelp`
- Add gradient divider between split and help sections
- Keep `FadeInOnScroll` on help section + divider

**Files:**
- `src/app/(shared)/contact/page.tsx` (modify)

## Technical Considerations

### Dark Form Theming
The dark form card uses **hardcoded colors** (not CSS custom properties) because it's always dark regardless of site theme. This is the same approach as the image overlay. Add a code comment explaining this choice.

### Select Dropdown on Dark Background
The native `<select>` dropdown will show OS-default styling when opened. On dark backgrounds this can look jarring. Use a custom SVG chevron via `appearance-none` + `background-image` for the closed state. The open dropdown will still use OS defaults — this is acceptable.

### Icon SVGs
The 4 tile icons (handshake/academy, binoculars/scouting, camera, newspaper/media) should use inline SVGs. Use simple stroke-based icons matching the Material Symbols Outlined style used elsewhere. 20px, stroke-width 1.5.

## Acceptance Criteria

### Functional
- [x] Dark form card with gradient bg, translucent inputs, bright green submit
- [x] "Send us a message" + "24h Response" badge in form header
- [x] Privacy footer with lock icon below submit button
- [x] Success state styled for dark background (green check, light text)
- [x] Gradient divider between split section and help section
- [x] "How Can We Help?" centered header with green dash + serif heading
- [x] 2×2 icon tile grid with icon boxes, titles, descriptions, links
- [x] Partner footer shows Starlive + Free Football Agency (decorative, no links)
- [x] All new text uses `t()` with en/ka translations

### Non-Functional
- [x] Old faq/demo translation keys removed
- [x] `ContactPartners.tsx` and `ContactFAQ.tsx` deleted
- [x] Mobile responsive: tiles stack single column, form padding tightens
- [x] `npm run build` passes
- [x] FadeInOnScroll on help section + divider

## Sources & References

- **Spec:** [docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md](docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md)
- **Mockups:** `.superpowers/brainstorm/56206-1775149317/content/02-contact-page-variants-v2.html` (Variant D), `03-form-variants.html` (Form C)
- **Current form:** `src/components/contact/ContactForm.tsx`
- **Current split:** `src/components/contact/ContactSplit.tsx`
- **Current partners:** `src/components/contact/ContactPartners.tsx` (to delete)
- **Current FAQ:** `src/components/contact/ContactFAQ.tsx` (to delete)
- **Page:** `src/app/(shared)/contact/page.tsx`
- **Translations:** `src/lib/translations/landing.ts`
