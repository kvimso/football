---
title: Contact Page Redesign
type: feat
date: 2026-04-02
status: approved
---

# Contact Page Redesign

Transform the minimal centered-card contact page into a full editorial layout with professional credibility signals, matching the quality of the About page redesign.

## Current State

- Single centered card (`max-w-md`) with name/email/message fields
- No office info, no image, no subject routing, no partner strip
- `ContactForm.tsx` client component calls `submitContactMessage` server action
- Validation via `contactMessageSchema` (Zod), rate-limited to 3 per email per hour
- Metadata still says "Georgian Football Talent" instead of "Binocly"

## Design Decisions

### Layout: Full Editorial (5 sections)

1. **Hero** — left-aligned, green dash + uppercase label + serif headline + subtitle
2. **Split Section** — 5:7 grid. Left: full-height stadium image with gradient overlay and contact info at bottom. Right: form card.
3. **Partner Strip** — horizontal bar with Starlive + Pixellot logos
4. **FAQ/CTA Section** — 1:2 grid. Left: "Professional Demo" highlight card. Right: 2x2 info cards (Academy, Scouting, Camera, Media).
5. **Footer** — existing `LandingFooter` or `Footer` via `(shared)` layout (no changes needed)

### Hero Details

- Pattern: green dash (`w-5 h-[2px] bg-primary`) + uppercase label ("CONTACT") — matches About page
- Headline: `"Let's Talk"` — Noto Serif, `text-[2.75rem]` on desktop, `font-black`
- Subtitle: `"Questions about scouting, academy partnerships, or camera technology? We respond within 24 hours."`
- Left-aligned, max-width ~520px on subtitle
- Padding: `pt-[72px] pb-12` desktop, `pt-12 pb-9` mobile

### Split Section: Image Column (Left)

- Full-height image column, `border-radius: 12px`, `overflow: hidden`, `min-height: 500px`
- Image: stadium/football photo — use `public/images/contact/hero.jpg` (download from Unsplash `photo-1556056504-5c7696c4c28d`, 800x1000 crop)
- Image treatment: `grayscale(20%) sepia(8%) brightness(88%)` + green tint overlay (`rgba(27,138,74,0.05)` mix-blend-multiply)
- Gradient overlay: `linear-gradient(to top, rgba(10,10,8,0.85) 0%, rgba(10,10,8,0.3) 40%, transparent 70%)`
- Contact info overlaid at bottom (inside gradient), with:
  - **Tbilisi Office**: address, phone (green label `#4ADE80`, white text `rgba(255,255,255,0.85)`, phone muted `rgba(255,255,255,0.45)`)
  - **Direct Inquiry**: `hello@binocly.ge` (underlined, white)
  - **Response Time**: "Within 24 hours"
- Labels: `10px uppercase letter-spacing:2.5px color:#4ADE80 font-weight:700`
- On mobile: image column stacks above form, `min-height: 300px`

### Split Section: Form Card (Right)

- Background: `bg-surface` (`#F4F1EC`), `border-radius: 12px`, `padding: 44px` desktop / `28px` mobile
- Subtle border: `1px solid rgba(0,0,0,0.03)`
- Fields:
  1. **Full Name** + **Email Address** — side by side (`grid-cols-2`), single column on mobile
  2. **Subject** — `<select>` dropdown with options:
     - General Inquiry
     - Academy Partnership
     - Scouting Access
     - Camera Technology / Starlive
     - Media & Press
  3. **Message** — `textarea`, 6 rows
- Labels: `10px uppercase letter-spacing:1.5px color:foreground-faint font-weight:700`
- Inputs: `bg-background border-border rounded-md p-[13px]`, focus: `border-primary` + `ring-3 ring-primary/8`
- Submit button: full-width `btn-primary`, uppercase, `letter-spacing: 2.5px`, green shadow `0 4px 16px rgba(27,138,74,0.2)`
- Pre-fill email if user is authenticated (existing behavior, keep it)
- Server action: existing `submitContactMessage` — add `subject` field to schema and DB table
- Success state: existing checkmark animation (keep it)

### Partner Strip

- Full-width bar, `border-top` + `border-bottom` with `border-border`
- Light background tint: `rgba(244,241,236,0.25)`
- Content centered: label "Strategic Technical Partners" + logos
- Label: `10px uppercase letter-spacing:3px color:foreground-faint font-weight:700`
- Logos: Starlive (circle icon "SL" + text) + Pixellot (italic bold text)
- Logos at `opacity: 0.45`, hover → `opacity: 0.75` with transition
- No "DATAHUB" — only real partners

### FAQ/CTA Section

- `1fr 2fr` grid (single column on mobile)
- Left: highlight card
  - `bg-surface/40`, `border border-border`, `rounded-lg`, `p-9`
  - Title: "Professional Demo" (`text-lg font-extrabold`)
  - Description: "Want to see our talent database and scouting analytics in real-time? Request a personalized walkthrough."
  - Link: "Request Access →" (`text-primary uppercase tracking-wider font-bold`), gap widens on hover
- Right: 2x2 grid of info cards
  - **Are you an academy?** — digitize talent, cameras, visibility
  - **Scouting requests?** — verified data, all leagues and age groups
  - **Camera technology?** — Starlive/Pixellot deployment
  - **Media inquiries?** — press, interviews, partnerships
- Card titles: `text-[15px] font-bold`, descriptions: `text-[13px] text-foreground-secondary`

## Component Architecture

```
src/app/(shared)/contact/page.tsx          — Server component, metadata, auth check for email
src/components/contact/ContactHero.tsx     — Server component (new)
src/components/contact/ContactSplit.tsx    — Server component wrapper (new)
src/components/contact/ContactImage.tsx    — Server component, next/image (new)
src/components/contact/ContactForm.tsx     — Client component (existing, modify)
src/components/contact/ContactPartners.tsx — Server component (new)
src/components/contact/ContactFAQ.tsx      — Server component (new)
```

- `ContactForm.tsx` — add `subject` field (select), keep existing server action logic
- All new components are server components using `getServerT()` for i18n
- Wrap sections in `FadeInOnScroll` for scroll animations (same as About page)

## i18n — New Translation Keys

All keys under `contact.*` namespace. Both `en` and `ka` required.

```
contact.label          — "Contact" / "კონტაქტი"
contact.heading        — "Let's Talk" / "მოდი, ვისაუბროთ"
contact.subtitle       — "Questions about scouting..." / "შეკითხვები სკაუტინგის..."
contact.officeLabel    — "Tbilisi Office" / "თბილისის ოფისი"
contact.officeAddress1 — "Rustaveli Avenue 14"
contact.officeAddress2 — "0108 Tbilisi, Georgia"
contact.officePhone    — "+995 32 2XX XXX"
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
```

Existing keys (`contact.title`, `contact.name`, `contact.email`, `contact.message`, etc.) are kept for the form fields.

## Database Change

Add `subject` column to `contact_messages` table:

```sql
ALTER TABLE contact_messages ADD COLUMN subject text DEFAULT 'general';
```

Update `contactMessageSchema` in `validations.ts` to include optional `subject` field.

## Image

- Download from Unsplash: `photo-1556056504-5c7696c4c28d` (football stadium at dusk)
- Save as: `public/images/contact/hero.jpg`
- Crop: 800x1000 (portrait for the tall column)
- If Andria provides his own image later, swap it out

## Responsive Behavior

- **Desktop (lg+):** 5:7 split grid, image column full height
- **Tablet (md):** same grid but tighter gap
- **Mobile (<900px):** single column stack — hero → image (300px) → form → partners (vertical) → FAQ (single col) → footer

## What NOT to Change

- `(shared)` layout (Navbar/Footer already handled)
- Server action logic (rate limiting, DB insert)
- Auth check for email pre-fill
- Success state animation
- `FadeInOnScroll` component (reuse from About page)

## Acceptance Criteria

- [ ] Hero matches About page pattern (green dash + label + serif heading)
- [ ] Stadium image fills left column with gradient + overlaid info
- [ ] Form has subject dropdown with 5 options
- [ ] Subject saved to `contact_messages` table
- [ ] Partner strip shows Starlive + Pixellot only
- [ ] FAQ section has demo highlight + 4 info cards
- [ ] All text uses `t()` with en/ka translations
- [ ] Metadata: "Contact | Binocly"
- [ ] Mobile responsive (single column stack)
- [ ] `npm run build` passes
- [ ] FadeInOnScroll on below-fold sections
- [ ] Pre-fills email for authenticated users

## Mockup Reference

- `.superpowers/brainstorm/48971-1775143027/content/07-all-variants.html` — Variant A (Original)

## Source

- User-provided HTML mockup analyzed during brainstorming session
- Design decisions validated via visual companion
