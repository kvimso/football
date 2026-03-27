---
title: Success Stories Component Redesign
type: feat
status: completed
date: 2026-03-27
origin: docs/superpowers/specs/2026-03-27-success-stories-component-design.md
---

# Success Stories Component Redesign

Rebuild the SuccessStories component to match the updated spec: two-column card body with Career Path timeline (left) and Achievements badges (right), pixel-perfect dot/line timeline system, and theme-aware dark mode.

## Acceptance Criteria

- [x] Card body is a 2-column grid: Career Path (left) + Achievements (right)
- [x] Timeline uses tl-track/tl-dot/tl-line-up/tl-line-down system (10px dots, 2px lines, no overshoot)
- [x] Default dots: white fill + gray border. Current dot: green border + glow
- [x] Lines connect dot-center to dot-center only (first item: line-down only, last: line-up only)
- [x] Achievements column: 3 badges per card with `bg-surface`, `border-left: 3px solid primary`, `rounded-lg`
- [x] Badge content: title (bold) + description (smaller, secondary)
- [x] Both columns equal height via `align-items: stretch` + `justify-content: space-between`
- [x] Column headers: "CAREER PATH" / "ACHIEVEMENTS" — small, uppercase, faint
- [x] Photo area: 200px height, updated gradients (green for Kvara, red for Mama)
- [x] Section heading centered with green underline bar
- [x] Photo overlay: flag + name + position (left), fee in #4ADE80 (right)
- [x] Dark mode: all colors use CSS custom properties (--surface, --primary, --foreground, etc.)
- [x] Mobile: cards stack, but card body stays two-column
- [x] New translation keys: careerPath, achievements, present, 6 achievement titles/descriptions
- [x] `npm run build` passes

## Implementation

**Files to modify:**
- `src/components/landing/SuccessStories.tsx` — full rewrite
- `src/lib/translations/landing.ts` — add ~12 new keys (EN + KA)

**Data (hardcoded):**

Kvaratskhelia achievements: Serie A Champion (2022-23), Serie A MVP (2022-23), 40+ International Caps
Mamardashvili achievements: La Liga Best GK (2023-24), Most Saves Euro 2024 (29), Record Georgian Transfer (€30M)

**Visual reference:** `.superpowers/brainstorm/12170-1774630259/content/timeline-fix.html`

## Sources

- **Spec:** [docs/superpowers/specs/2026-03-27-success-stories-component-design.md](../superpowers/specs/2026-03-27-success-stories-component-design.md)
- **HTML mockup:** `.superpowers/brainstorm/12170-1774630259/content/timeline-fix.html`
- **Current component:** `src/components/landing/SuccessStories.tsx`
