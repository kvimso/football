---
title: What We Offer — Hero Top Bento
type: feat
status: active
date: 2026-04-15
mockup: .superpowers/brainstorm/18402-1776251410/content/landing-with-variants.html
---

# What We Offer — Hero Top Bento

## Overview

Replace the current 3-column "What we offer" grid on `/` with a richer Bento section: one wide dark feature card on top (verified profiles, split text-left / profile-stack-right), and two smaller cream cards below (live league standings, chat thread mock) side by side. Same three propositions as before, new layout and richer visuals.

This is the "Hero Top" variant chosen after reviewing Editorial, Tabs, Bento, and Magazine concepts.

## Problem Statement

The current `does` section is three flat text columns — professional but inert. It tells scouts *what* we do without *showing* the product. Scouts need to believe that the data is real, the leagues are live, and the academy conversations happen. Flat copy doesn't carry that.

## Proposed Solution

One section, three cards, one layout:

1. **Feature card (wide, dark, row 1, spans 2 columns)** — "Verified player profiles". Split internally: text block left (eyebrow, title, 37,600-players paragraph, "Browse all players →"), 3 stacked profile cards with Verified badges on the right.
2. **League card (row 2, left)** — "Real-time league data". Shows a mini U-19 Premier standings table with club logos, pulsing LIVE indicator, live score footer.
3. **Chat card (row 2, right)** — "Direct academy contact". Mock chat thread with header, outgoing bubble + read receipt, incoming bubble, animated typing dots, and a disabled input field.

Grid rule: `1fr 1fr` columns, two rows. Feature spans `grid-column: 1 / span 2` on row 1. Feature internally uses `grid-template-columns: 1.05fr 1fr` with a 48px column gap.

## Implementation Phases

### Phase 1 — Remove old markup

- Delete `.does`, `.does-grid`, `.does-item`, `.does-num`, `.does-title`, `.does-text`, `.does-link` from `src/components/landing/*` and `src/app/globals.css`.
- Delete the section in `src/app/(public)/page.tsx`.

### Phase 2 — New section component

Create `src/components/landing/WhatWeOffer.tsx` (server component, no client boundary needed — all interaction is mocked UI).

Structure:

```
<section>
  <SectionHeader eyebrow="What we offer" title="A scouting platform <em>built for professionals.</em>" />
  <div className="bento-grid">
    <FeatureCard />   {/* wide, spans 2 cols on row 1 */}
    <LeagueCard />    {/* row 2 col 1 */}
    <ChatCard />      {/* row 2 col 2 */}
  </div>
</section>
```

Each of the three cards is its own component in the same file (not exported — private to the section). Keep markup static; no props for now.

### Phase 3 — Styles

Add to `src/app/globals.css` under a new `/* ============ WHAT WE OFFER ============ */` block. Port classes directly from the mockup (`.v3-wrap`, `.v3-card`, `.v3-card-feature`, `.v3-profile-stack`, `.v3-pcard`, `.v3-mini-*`, `.v3-chat-*`, plus the `.bento-b` grid layout rules). Rename to a cleaner prefix — `.offer-*` is my suggestion — to avoid the `v3-` legacy from the variant experiment.

Key measurements to preserve:
- Grid gap: 20px
- Feature card padding: 44px 48px, border-radius: 18px, dark bg (`var(--foreground)`)
- Small cards padding: 28px, border-radius: 18px
- Profile stack height: 180px, `align-self: center`
- Hover: `translateY(-3px)` + green border on small cards; deeper shadow on feature
- Pulse + typing animations (copy exactly)

### Phase 4 — Logos & live data mock

- Move club logos from `public/images/clubs/*.jpg` to `.png` or `.svg` (transparent). Minimum: Dinamo Tbilisi, Torpedo Kutaisi, Iberia 1999.
- **Locomotive logo**: save a local copy from `https://api.starliveball.com/assets/LOCOMOTIVE.png` into `public/images/clubs/locomotive-tbilisi.png`. Do not hotlink the Starlive CDN in production.
- League standings and chat data are hardcoded in the component — they're a marketing mock, not live data.

### Phase 5 — Responsive

- `<900px`: bento grid collapses to single column. Feature card's internal split also collapses (text on top, profile stack below). League and chat stack vertically.
- Profile stack stays `180px` on mobile; pcards remain readable.

## Content (final copy)

**Section header**
- Eyebrow: `WHAT WE OFFER`
- Title: `A scouting platform <em>built for professionals.</em>`

**Feature card (№ 01 · The foundation)**
- Title: `Verified player profiles, top to bottom.`
- Body: `37,600 youth players. Every stat camera-verified by Pixellot. No inflation, no fiction — just the truth of what happens on the pitch.`
- CTA: `Browse all players →` → `/players`
- Profile stack (3 cards): Nika Kobakhidze / DEF · 17 · Iberia · Verified; Aleko Basiladze / ATT · 19 · Torpedo · Verified; Luka Tabatadze / MID · 18 · Dinamo Tbilisi · Verified.

**League card (№ 02 · The pulse)**
- Title: `Real-time league data.`
- Body: `Twelve leagues. Every match. Updated the moment it happens.`
- Table header: `U-19 Premier · Matchday 18` + pulsing `● LIVE`
- Rows (with logos): `01 Dinamo Tbilisi 44 (active)`, `02 Torpedo Kutaisi 39`, `03 Iberia 1999 36`, `04 Locomotive 31`
- Footer: `Updated 14s ago` / `↑ Dinamo 2 – 1 Iberia`
- CTA: `Explore leagues →` → `/leagues`

**Chat card (№ 03 · The direct line)**
- Title: `Direct academy contact.`
- Body: `No middlemen. No gatekeepers. Just conversations.`
- Header: `TK · Torpedo Kutaisi · Active now`
- Divider: `Today`
- Outgoing bubble (scout): `Interested in Basiladze — available for a trial this month?` / `14:02 ✓✓`
- Incoming bubble (academy): `Yes — sending footage + availability by EOD.` / `14:08`
- Typing dots (animated, academy side)
- Input field placeholder: `Write a message…` + green send arrow
- CTA: `Start messaging →` → `/login` (auth-gated — scouts must log in)

## Files

**New:**
- `src/components/landing/WhatWeOffer.tsx`
- `public/images/clubs/locomotive-tbilisi.png`

**Modified:**
- `src/app/(public)/page.tsx` — swap `<Does />` (or equivalent) for `<WhatWeOffer />`
- `src/app/globals.css` — remove `.does-*`, add `.offer-*` block (~280 lines)
- Optional: convert existing club JPGs to transparent PNG/SVG for cleaner card rendering

**Deleted:**
- Any existing `does.tsx` / `WhatWeDo.tsx` if one exists

## Dependencies & assumptions

- No DB queries. No translations needed (English-only per 2026-04 direction).
- Server component — no `'use client'` required; all animations are pure CSS.
- `/players`, `/leagues`, `/login` routes already exist.
- Club logo files present: `dinamo-tbilisi`, `torpedo-kutaisi`, `iberia-1999`. Locomotive must be downloaded before shipping.

## Out of scope

- Real live league data wiring (the table is a marketing mock; connecting to Supabase is a separate ticket).
- Real chat data (it's a visual fake — no WebSocket, no realtime).
- Animating the profile stack on scroll / hover (static stack with one "active" (Luka) card is sufficient).
- Light/dark toggle handling — this component assumes the cream-background light theme only.
