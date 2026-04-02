---
title: Contact Page Redesign — Editorial Layout
type: feat
status: completed
date: 2026-04-02
origin: docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md
---

# Contact Page Redesign — Editorial Layout

## Overview

Transform `/contact` from a minimal centered-card page (38 lines, single form) into a 5-section editorial layout: Hero, Split Image+Form, Partner Strip, FAQ/CTA cards, and Footer (existing). Adds a `subject` dropdown to the form, a `subject` column to `contact_messages`, ~30 new i18n keys, and 4 new server components. Follows the About page redesign pattern exactly.

## Problem Statement / Motivation

The current Contact page is the weakest public page — a lone form card floating in empty space. As a public marketing page in `(shared)/`, it needs to match the editorial quality of the redesigned Landing, About, and Leagues pages. The page should build trust (partner logos, office info, FAQ cards) and convert visitors into contacts.

## Proposed Solution

5-section editorial page, all server components except the existing `ContactForm` client component:

1. **Hero** — green dash + serif headline + subtitle (matches About hero pattern)
2. **Split Section** — 5:7 grid. Left: stadium image with gradient overlay + overlaid contact info. Right: form card with new Subject dropdown.
3. **Partner Strip** — Starlive + Pixellot text logos with hover opacity
4. **FAQ/CTA Section** — 1:2 grid. Left: "Professional Demo" highlight card. Right: 2×2 info cards.
5. **Footer** — existing `(shared)` layout (no changes)

## Implementation Phases

### Phase 1: Database Migration

Add `subject` column to `contact_messages`:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_subject_to_contact_messages.sql
ALTER TABLE contact_messages ADD COLUMN subject text NOT NULL DEFAULT 'general';
```

**Subject slugs** (stored in DB): `general`, `academy`, `scouting`, `camera`, `media`

Add `CONTACT_SUBJECTS` constant to `src/lib/constants.ts`:

```typescript
export const CONTACT_SUBJECTS = [
  'general', 'academy', 'scouting', 'camera', 'media',
] as const
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]
```

Update `contactMessageSchema` in `src/lib/validations.ts`:

```typescript
export const contactMessageSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.enum(['general', 'academy', 'scouting', 'camera', 'media']).default('general'),
  message: z.string().min(10).max(2000),
})
```

Update `submitContactMessage` in `src/app/actions/contact-message.ts`:
- Accept `subject` field from validated data
- Include `subject` in the Supabase insert
- **Fix rate limiter bug:** Switch count query from `createClient()` to `createAdminClient()` — the `contact_messages` table has no SELECT policy, so the current rate limiter always returns 0 (non-functional)

**Files:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_subject_to_contact_messages.sql` (new)
- `src/lib/constants.ts` (add `CONTACT_SUBJECTS`)
- `src/lib/validations.ts` (update `contactMessageSchema`)
- `src/app/actions/contact-message.ts` (add `subject`, fix rate limiter)

### Phase 2: Translations

Add ~30 new keys under `contact.*` namespace in `src/lib/translations/landing.ts` (both EN and KA).

**New key groups:**
```
contact.label          — "CONTACT" / "კონტაქტი"
contact.heading        — "Let's Talk" / "მოდი, ვისაუბროთ"
contact.subtitle       — "Questions about scouting..." / "შეკითხვები სკაუტინგის..."
contact.officeLabel    — "Tbilisi Office" / "თბილისის ოფისი"
contact.officeAddress1 — "Rustaveli Avenue 14" / "რუსთაველის გამზირი 14"
contact.officeAddress2 — "0108 Tbilisi, Georgia" / "0108 თბილისი, საქართველო"
contact.emailLabel     — "Direct Inquiry" / "პირდაპირი კავშირი"
contact.emailAddress   — "hello@binocly.ge"
contact.responseLabel  — "Response Time" / "პასუხის დრო"
contact.responseValue  — "Within 24 hours" / "24 საათის განმავლობაში"
contact.partnersLabel  — "Strategic Technical Partners" / "სტრატეგიული ტექნიკური პარტნიორები"
contact.subject        — "Subject" / "თემა"
contact.subjectGeneral — "General Inquiry" / "ზოგადი შეკითხვა"
contact.subjectAcademy — "Academy Partnership" / "აკადემიის პარტნიორობა"
contact.subjectScout   — "Scouting Access" / "სკაუტინგის წვდომა"
contact.subjectCamera  — "Camera Technology / Starlive" / "კამერის ტექნოლოგია / Starlive"
contact.subjectMedia   — "Media & Press" / "მედია და პრესა"
contact.demoTitle      — "Professional Demo" / "პროფესიონალური დემო"
contact.demoDesc       — "Want to see our talent database..." / "გსურთ ნახოთ ჩვენი..."
contact.demoLink       — "Request Access" / "მოითხოვეთ წვდომა"
contact.faq0Title      — "Are you an academy?" / "აკადემია ხართ?"
contact.faq0Desc       — "We digitize local talent..." / "ჩვენ ვაციფრებთ..."
contact.faq1Title      — "Scouting requests?" / "სკაუტინგის მოთხოვნები?"
contact.faq1Desc       — "Our platform provides verified data..." / "ჩვენი პლატფორმა..."
contact.faq2Title      — "Camera technology?" / "კამერის ტექნოლოგია?"
contact.faq2Desc       — "Through our partner Starlive..." / "ჩვენი პარტნიორი Starlive-ის..."
contact.faq3Title      — "Media inquiries?" / "მედია შეკითხვები?"
contact.faq3Desc       — "For press, interviews..." / "პრესისთვის, ინტერვიუებისთვის..."
contact.heroImageAlt   — "Football stadium" / "საფეხბურთო სტადიონი"
```

Existing keys (`contact.title`, `contact.name`, `contact.email`, `contact.message`, `contact.send`, `contact.sent`, `contact.sentDesc`, `contact.messagePlaceholder`) are kept for the form.

**Files:**
- `src/lib/translations/landing.ts` (add ~30 keys in both en and ka objects)

### Phase 3: Image & Assets

- Create `public/images/contact/` directory
- Download stadium image from Unsplash (`photo-1556056504-5c7696c4c28d`), save as `public/images/contact/hero.jpg` (800×1000 portrait crop)
- Until Andria provides his own image, this is a placeholder

Partner logos: Starlive and Pixellot rendered as styled text (no image files needed — matches the landing page `Partners.tsx` pattern of CSS-only logos).

**Files:**
- `public/images/contact/hero.jpg` (new — placeholder from Unsplash)

### Phase 4: Section Components

Split into 4 new server components + modify existing `ContactForm`:

**`src/components/contact/ContactHero.tsx`** (new, server component):
- Pattern: matches `AboutHero.tsx` — green dash, uppercase label, serif headline, subtitle
- Headline: "Let's Talk" in Noto Serif (English) / font-sans (Georgian) — follow About hero `isKa` pattern
- Subtitle: max-width ~520px, `text-foreground-secondary`
- Padding: `pt-[72px] pb-12` desktop, `pt-12 pb-9` mobile
- All text via `t()`

**`src/components/contact/ContactSplit.tsx`** (new, server component):
- 5:7 grid (`grid-cols-[5fr_7fr]`) on desktop, single column on mobile
- Left: `ContactImage` (inline, not separate file) — `next/image` with `fill`, `object-cover`, grayscale/sepia filter, gradient overlay, overlaid contact info at bottom
  - Image: `priority` (above fold), `sizes="(max-width: 900px) 100vw, 42vw"`
  - Gradient: `linear-gradient(to top, rgba(10,10,8,0.85) 0%, rgba(10,10,8,0.3) 40%, transparent 70%)`
  - Contact info: green labels + white text (hardcoded — always over dark gradient, comment explaining why)
  - Email: `<a href="mailto:hello@binocly.ge">` (clickable)
  - **Omit phone number** until a real number is available (placeholder `+995 32 2XX XXX` damages credibility)
- Right: `<ContactForm>` in a `bg-surface` card with `rounded-xl p-11`
  - Name + Email side-by-side on desktop (`grid-cols-2`), stacked on mobile
  - Subject `<select>` below name/email row
  - Message textarea, 6 rows
  - Full-width submit button with green shadow
- Mobile (<900px): single column — image (300px) stacks above form

**`src/components/contact/ContactPartners.tsx`** (new, server component):
- Full-width bar with `border-y border-border`
- Background: `bg-surface/25` (theme-aware, not hardcoded rgba)
- Centered: label "Strategic Technical Partners" + Starlive/Pixellot text logos
- Logos: `opacity-45 hover:opacity-75 transition-opacity` — **decorative, no links** (consistent with landing page Partners)
- No cursor-pointer (not interactive)
- Mobile: logos stack vertically

**`src/components/contact/ContactFAQ.tsx`** (new, server component):
- 1:2 grid (`grid-cols-[1fr_2fr]`) on desktop, single column on mobile
- Left: "Professional Demo" highlight card — `bg-surface/40 border border-border rounded-lg p-9`
  - Title + description + "Request Access →" link
  - **Link destination:** scrolls to the form section and pre-selects "Scouting Access" subject (via `#contact-form` anchor + URL param `?subject=scouting`). Simpler than linking to `/demo` — keeps user on page.
- Right: 2×2 grid of info cards — static text cards (no links)
  - Academy, Scouting, Camera, Media — each with title + description
- All text via `t()`

**Modify `src/components/contact/ContactForm.tsx`** (existing client component):
- Add `subject` prop (optional, for pre-selection via URL param)
- Add `<select>` dropdown with 5 subject options (translated labels, slug values)
- Name + Email in `grid-cols-2` on desktop
- Labels: `text-[10px] uppercase tracking-wider text-foreground-faint font-bold`
- Inputs: `bg-background border-border rounded-md p-[13px]`
- Submit: `btn-primary w-full uppercase tracking-[2.5px]` + green shadow
- Keep success state, keep email pre-fill, keep rate limiting errors

**Files:**
- `src/components/contact/ContactHero.tsx` (new)
- `src/components/contact/ContactSplit.tsx` (new)
- `src/components/contact/ContactPartners.tsx` (new)
- `src/components/contact/ContactFAQ.tsx` (new)
- `src/components/contact/ContactForm.tsx` (modify — add subject, layout changes)

### Phase 5: Page Assembly & Polish

**Rewrite `src/app/(shared)/contact/page.tsx`:**
- Keep existing auth check pattern (createClient → getUser → userEmail)
- Compose sections wrapped in `FadeInOnScroll` with staggered delays (0, 50, 100, 150, 200)
- Hero is NOT wrapped in FadeInOnScroll (always visible immediately, matches About pattern)
- **No `revalidate`** — page passes `userEmail` (PII) to form, ISR would cache it and leak to other visitors
- Read `?subject=` from searchParams and pass to ContactForm for pre-selection

**Update metadata:**
```tsx
export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Binocly. Questions about scouting, academy partnerships, or camera technology? We respond within 24 hours.',
  openGraph: {
    title: 'Contact Binocly',
    description: 'Questions about scouting, academy partnerships, or camera technology?',
  },
}
```

**Files:**
- `src/app/(shared)/contact/page.tsx` (rewrite)

## Technical Considerations

### Architecture
- All 4 new components are **server components** — no `'use client'`
- Each calls `getServerT()` independently (never pass `t` as prop across file boundaries)
- `ContactForm.tsx` stays `'use client'` — uses `useLang()` for client translations
- Page does auth check, passes `defaultEmail` to form (existing pattern)
- No new API routes, no new DB queries beyond the existing contact_messages insert

### Dark Mode
- Image overlay: hardcoded gradient + text colors (always over dark image, works in both themes). Add code comment explaining why.
- Form card: `bg-surface` auto-adapts. Border should use `border-border` (not hardcoded rgba).
- Partner strip: `bg-surface/25` auto-adapts (not hardcoded rgba).
- FAQ cards: `bg-surface/40` auto-adapts.
- All other text uses theme-aware CSS custom properties.

### Performance
- **No ISR** (`revalidate`) — page passes PII (`userEmail`), must render per-request
- Hero image: `priority` for LCP, proper `sizes` prop
- `content-visibility: auto` on Partner Strip and FAQ sections (below fold)
- `FadeInOnScroll` handles animation via `useInView` (Intersection Observer)

### Accessibility
- `<h1>` in Hero only, `<h2>` for section titles
- Form `<label>` elements properly associated via `htmlFor`
- `<select>` has visible label
- Image: `alt` text via `t('contact.heroImageAlt')`
- Email overlay: `<a href="mailto:...">` with accessible text
- Touch targets: min 44×44px on all interactive elements
- Partner logos: `aria-hidden="true"` (decorative)

### Rate Limiter Fix
Pre-existing bug: `submitContactMessage` uses cookie-based client to count recent messages, but `contact_messages` has no SELECT policy. Count always returns 0 → rate limiter is non-functional.

**Fix:** Switch count query to `createAdminClient()` (service role, bypasses RLS). This is the correct pattern — the rate limiter needs to read all rows by email, regardless of the current user's role.

### Georgian Font Fallback
Hero headline uses Noto Serif for English. Georgian language falls back to `font-sans` (Noto Sans Georgian) using the same `isKa` conditional from `AboutHero.tsx`.

## Acceptance Criteria

### Functional
- [x] Hero matches About page pattern (green dash + label + serif heading)
- [x] Stadium image fills left column with gradient + overlaid contact info
- [x] Email overlay is a clickable `mailto:` link
- [x] Phone number omitted (placeholder, not real)
- [x] Form has subject dropdown with 5 options (translated labels, slug values)
- [x] Subject saved to `contact_messages.subject` column
- [x] "Request Access" scrolls to form with subject pre-selected
- [x] Partner strip shows Starlive + Pixellot only (decorative, no links)
- [x] FAQ section has demo highlight + 4 static info cards
- [x] Pre-fills email for authenticated users (existing behavior)
- [x] Rate limiter actually works (uses admin client for count)
- [x] Success state shows within form card only (image column persists)

### Non-Functional
- [x] All text uses `t()` with en/ka translations (~30 new keys)
- [x] Metadata: "Contact | Binocly" + OpenGraph tags
- [x] Georgian headline uses `font-sans` fallback (no Noto Serif for Georgian)
- [x] Mobile responsive: single column stack at <900px
- [x] `FadeInOnScroll` on below-fold sections (Partners, FAQ)
- [x] `content-visibility: auto` on below-fold sections
- [x] `prefers-reduced-motion` respected (via FadeInOnScroll)
- [x] Image has `alt` text via translation key
- [x] Dark mode renders correctly (form card, partner strip, FAQ cards all use theme tokens)
- [x] `npm run build` passes

## Component Architecture

```
src/components/contact/
  ContactForm.tsx       (existing — modify: add subject dropdown, layout changes)
  ContactHero.tsx       (new — hero section)
  ContactSplit.tsx      (new — image + form split)
  ContactPartners.tsx   (new — partner strip)
  ContactFAQ.tsx        (new — demo CTA + info cards)
```

**Total: 4 new files** + modify 1 existing + rewrite page.tsx + migration + translations + constants

## Dependencies & Risks

- **Stadium image:** Placeholder from Unsplash. Andria may provide his own later.
- **Contact info:** Email (`hello@binocly.ge`) may not be configured yet. Phone omitted until real.
- **Rate limiter fix:** Changing from cookie client to admin client requires `createAdminClient` import — already available in `src/lib/supabase/admin.ts`.
- **Partner strip inconsistency:** Landing page shows "Free Football Agency + Starlive", Contact shows "Starlive + Pixellot". This is intentional (different contexts), but note for future alignment.

## What NOT to Change

- `(shared)` layout (Navbar/Footer already handled)
- Server action core logic (rate limiting pattern, DB insert)
- Auth check for email pre-fill (keep existing)
- Success state animation (keep existing checkmark)
- `FadeInOnScroll` component (reuse as-is)
- Other pages or components

## Sources & References

- **Spec:** [docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md](docs/superpowers/specs/2026-04-02-contact-page-redesign-design.md)
- **Mockup:** `.superpowers/brainstorm/48971-1775143027/content/07-all-variants.html`
- **Current page:** `src/app/(shared)/contact/page.tsx` (38 lines)
- **Current form:** `src/components/contact/ContactForm.tsx` (113 lines)
- **Server action:** `src/app/actions/contact-message.ts` (42 lines)
- **Validation:** `src/lib/validations.ts:106-110`
- **Translations:** `src/lib/translations/landing.ts:263-272` (EN), `:535-544` (KA)
- **About hero pattern:** `src/components/about/AboutHero.tsx`
- **About page assembly:** `src/app/(shared)/about/page.tsx`
- **Migration:** `supabase/migrations/20250101000022_create_contact_messages.sql`
