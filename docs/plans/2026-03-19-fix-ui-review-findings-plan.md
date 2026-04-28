---
title: Fix UI Review Findings
type: fix
status: active
date: 2026-03-19
---

# Fix UI Review Findings

Post-redesign UI audit identified 12 issues across contrast, fonts, responsive tables, i18n, and CSS consistency. All fixes are isolated to single files with no cross-dependencies.

## P2 — Should Fix

### 1. Email templates use old emerald palette
- **File:** `src/lib/email-templates.ts:34-44`
- **Problem:** Hardcoded `#0a0f0d`, `#10b981`, `#151d19` — old emerald theme
- **Fix:** Update to current palette: `#12110F` (bg), `#1C1A17` (surface), `#2A2623` (border), `#4ADE80` (primary), `#EEECE8` (foreground), `#9A9590` (muted)

### 2. Font config missing `display: 'swap'`
- **File:** `src/app/layout.tsx:11-20`
- **Problem:** 37 @font-face declarations without explicit `display: 'swap'` — fonts may never swap in, and causes Playwright screenshots to hang indefinitely
- **Fix:** Add `display: 'swap'` to both `Inter()` and `Noto_Sans_Georgian()` configs

### 3. `text-white` on `bg-primary` fails dark mode contrast
- **File:** `src/components/dashboard/WatchlistPlayerRow.tsx:181`
- **Problem:** White checkmark on bright green `#4ADE80` — both light colors, poor contrast
- **Fix:** Change `text-white` to `text-btn-primary-text`

### 4. Platform admin tables unreadable on mobile
- **Files:** `src/app/platform/scouts/page.tsx`, `src/app/platform/players/page.tsx`, `src/app/platform/clubs/page.tsx`, `src/app/(platform)/matches/[slug]/page.tsx`
- **Problem:** 7-11 columns with no responsive hiding — requires horizontal scroll on mobile
- **Fix:** Add `hidden sm:table-cell` on low-priority columns (dates, counts, secondary info)

### 5. Gold focus shadow leftover from previous redesign iteration
- **File:** `src/components/forms/FilterPanel.tsx:244`
- **Problem:** `rgba(201,162,39,0.08)` is gold accent from old iteration, doesn't match green primary
- **Fix:** Change to `rgba(74,222,128,0.08)` (green, matching `#4ADE80`)

## P3 — Nice to Have

### 6. Duplicated CSS blocks in globals.css
- **File:** `src/app/globals.css` (lines ~354-384 duplicated at ~413-443)
- **Problem:** `prefers-reduced-motion`, `skeleton-in`, `hero-parallax`, and card scale rules appear twice
- **Fix:** Remove the second duplicate block

### 7. Hardcoded English strings in Partners section
- **File:** `src/components/landing/Partners.tsx:25,49`
- **Problem:** "AI-powered sports cameras" and "Official Pixellot reseller" not translated
- **Fix:** Add `t('landing.pixellotDesc')` / `t('landing.starliveDesc')` + Georgian translations

### 8. Spinner on green button invisible in dark mode
- **File:** `src/components/chat/MessageAcademyButton.tsx:57`
- **Problem:** `border-white` / `border-white/30` on bright green bg
- **Fix:** Use `border-btn-primary-text` / `border-btn-primary-text/30`

### 9. Footer logo color inconsistent with Navbar
- **File:** `src/components/layout/Footer.tsx:19`
- **Problem:** Uses `text-background` while Navbar/LandingNav use `text-btn-primary-text`
- **Fix:** Change to `text-btn-primary-text`

### 10. NotificationBell aria-label hardcoded English
- **File:** `src/components/layout/NotificationBell.tsx:98`
- **Problem:** `aria-label="Notifications"` won't translate
- **Fix:** Use `aria-label={t('nav.notifications')}`

### 11. CtaBanner forces dark via inline styles
- **File:** `src/components/landing/CtaBanner.tsx:10-25`
- **Problem:** Inline `style={{ background: '#12110F' }}` bypasses theme system
- **Fix:** Use CSS variables (`bg-background text-foreground`) or a scoped dark class

### 12. Modals and MobileChatDrawer share z-50
- **Files:** `MobileChatDrawer.tsx:83`, `PlayerSearchModal.tsx:84`, `MessageBubble.tsx:265`
- **Problem:** Image lightbox + chat drawer at same z-index = stacking collision
- **Fix:** Give overlay modals `z-[60]`, keep drawers at `z-50`

## Acceptance Criteria

- [ ] P2-1: Email templates use current warm dark + green palette
- [ ] P2-2: Fonts have `display: 'swap'` — Playwright screenshots no longer hang
- [ ] P2-3: Checkbox checkmark visible on bright green bg in dark mode
- [ ] P2-4: Platform admin tables readable on 375px mobile without horizontal scroll for key columns
- [ ] P2-5: Focus shadow on FilterPanel is green, not gold
- [ ] P3-6: No duplicated CSS blocks in globals.css
- [ ] P3-7: Partners section fully bilingual
- [ ] P3-8: Button spinner visible on green bg in dark mode
- [ ] P3-9: Footer logo uses same color token as Navbar
- [ ] P3-10: NotificationBell aria-label translates
- [ ] P3-11: CtaBanner uses theme variables
- [ ] P3-12: Modals render above drawers
- [ ] `npm run build` passes clean after all changes
