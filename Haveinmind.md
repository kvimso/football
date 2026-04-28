# Have in Mind

Things to remember before or at launch — crucial decisions, purchases, or setup steps that are deferred during development. Claude must add to this file any time a discussion reaches a "we'll deal with that later" point. Andria reviews it before shipping to production.

---

## Domain + Email Sender (deferred 2026-04-22)

**Status:** Not yet purchased. Binocly has no domain. Resend account is set up (API key in Vercel prod + `.env.local`) but no domain is verified in Resend.

**Status update (2026-04-22):** Partial progress. `/demo` redesign PR is shipping internal alert emails using Resend's sandbox sender (`onboarding@resend.dev`) → delivered to `kvimsina@gmail.com` (the Resend account signup email). Andria sets up a Gmail auto-forward rule to relay alerts to Levani. User confirmation emails are NOT wired — sandbox can't reach arbitrary recipients.

**What's still to do before launch:**

1. **Buy a domain** — recommended: `binocly.com` via Cloudflare Registrar (~$10/yr, wholesale). Fallbacks if taken: `binocly.app`, `binocly.io`.
   - Registrar: https://dash.cloudflare.com/?to=/:account/registrar/register
2. **Verify the domain in Resend** (https://resend.com/domains) — add the 2-3 DNS records Resend provides, wait ~5 min for DNS to propagate, confirm verification.
3. **Update the `from:` in `src/lib/email.ts`** from `Binocly <onboarding@resend.dev>` (sandbox) → `Binocly <hello@binocly.com>` (or any verified address on the domain).
4. **Point the domain at Vercel** — Vercel project settings → Domains → add `binocly.com`. Replaces `football-v44v.vercel.app`.
5. **Add submitter confirmation email** in `submitDemoRequest` — a second `sendEmail()` call to `parsed.data.email` saying "Thanks — we'll be in touch within 24 hours." Only works after a domain is verified.
6. **Revisit the "From" display name** on the alert email once brand is stable (currently `Binocly <sandbox>`).
7. **Remove `kvimsina@gmail.com` hard-code** if team grows — consider moving alert recipients to an env var like `DEMO_ALERT_RECIPIENTS` so adding Levani (or a team alias) doesn't require a code change.

**Why deferred:** Andria doesn't want to buy the domain mid-development. The sandbox path unblocks internal alerts without requiring the domain. Revisit when design + implementation work is done and site is ready to go public.

## Gmail auto-forward to Levani (2026-04-22)

To relay `/demo` alerts to Levani's `levanitalakhadze0@gmail.com` without waiting for a domain:

1. In Gmail (logged in as `kvimsina@gmail.com`), Settings → Filters and Blocked Addresses → Create a new filter.
2. Filter: `From: onboarding@resend.dev` AND `Subject contains: New demo request`.
3. Action: Forward to `levanitalakhadze0@gmail.com` (you'll need to add it as a verified forwarding address first).
4. Save.

Once Binocly has its own domain + verified Resend sender, this Gmail filter can be deleted and we'll wire both recipients directly in code.

---

## Starlive API integration → v2 (deferred 2026-04-28)

**Status:** Not started. Will not ship for launch. Originally planned as Phase 7.

**The reality:** Starlive does not have API infrastructure built. They give Binocly free access to their **website** where match data, player stats, and league pages live. For launch, scouts click "Leagues" in our nav and are redirected out to Starlive's site — no data ingest on our side.

**When this gets revisited:** ~2–3 months post-launch, after Binocly proves revenue + partnership viability. Starlive will then build the API specifically for us. Andria's prompt-engineering skill and Claude's coding capability are also expected to be more mature by then, making the integration feasible.

**Pre-launch action items:** none. Just don't promise stats/video/highlights inside Binocly during demos — point at Starlive.

**Post-launch action items (when Starlive greenlights):**

1. Get API URL, API key, webhook secret from Starlive → set `PIXELLOT_API_URL`, `PIXELLOT_API_KEY`, `PIXELLOT_WEBHOOK_SECRET` in Vercel prod.
2. Build `/api/camera/webhook/route.ts` and `/api/camera/sync/route.ts` (descoped from launch — see old Phase 7 in CLAUDE.md history if rebuilding).
3. Reintroduce `matches`, `match_player_stats`, `player_videos` table writes (camera-only).
4. Add "Verified by Starlive" badge.
5. Player matching: `jersey_number` + `club_id`.

**Why deferred:** Building a real-time data ingest is multi-month work, requires partner-side infra that doesn't exist yet, and isn't a launch-blocker because the link-out gives scouts the same data without us having to mirror it.

---

## Three Starlive league URLs (deferred 2026-04-28)

**Status:** URLs not yet provided. The `/leagues` page (Phase 7 redesign) will ship with three buttons that redirect scouts to Starlive surfaces.

**What's needed before launch:**

1. Andria asks Starlive for the three exact URLs scouts should land on (e.g. by league tier, age group, or some other split — to be decided with Starlive).
2. Three button labels (English).
3. Drop into `/leagues/page.tsx` (constants or env vars — TBD).

**Why deferred:** Pages don't exist yet on Starlive's side either; will be defined together once partnership terms are formalized.

---

## Clubs design their own page (deferred 2026-04-28)

**Status:** Not started. Future feature, not launch-blocking.

**What it means:** Academy admins should eventually have rich self-service customization of their club page beyond the v1 fields (logo, hero photo, short history text, photo gallery). Long-term: theme colors, layout variants, custom sections, embedded video, etc. — closer to a "build your own club microsite" feel.

**v1 launch scope (this redesign):** academy admin gets structured fields only — logo, hero photo, history text (markdown or plain), photo gallery upload. No layout customization, no theming.

**Why deferred:** Not needed for launch. Most clubs won't fill in basic fields, let alone design pages. Revisit only if academy admins ask for more control after a few months of use.

---

## Club ranking tiebreaker rule (deferred 2026-04-28)

**Status:** Schema decision pending. `clubs.tier` field will be added to drive paid ranking on `/clubs`.

**Open question:** When two clubs share the same `tier` (e.g. both on the basic paid plan), how do we order them?

Options to evaluate before launch:
- Alphabetical by club name (predictable, fair, boring)
- Most-recent activity (last player added, last chat reply) — rewards engagement
- Random shuffle per scout session — gives every club equal exposure
- Created-at ascending (oldest first)

**Why deferred:** Pricing tiers aren't finalized. Once tier structure is set, pick a tiebreaker that fits the business model (e.g. if there's only one paid tier and "free", alphabetical is fine; if there are 3 tiers, recent-activity rewards the right behavior).

---

## Players code: kept in git, removed from runtime (decision 2026-04-28)

**Status:** Decided. Kill scout-facing player surfaces, keep academy admin CRUD.

**Plan when this lands in code:**

- DELETE: `(platform)/players/`, `(platform)/dashboard/`, `(platform)/matches/`, `components/player/PlayerCard*`, `RadarChart`, `StatsTable`, `CompareView`, `AISearchBar`, `useShortlist`, PDF export, view tracking, similar-players logic, `/api/contact`, `/api/players/search` (if scout-only).
- KEEP: `/admin/players/` (academy admins still register/edit their own players — this is how the club page roster gets populated), `players` table, RLS, `player_club_history`, transfer system.
- Don't move to `_archive/` — git history is the archive. If we need a fragment back in two weeks, `git log --all --diff-filter=D --name-only -- '*PlayerCard*'` finds it.

**Why kept (admin side):** Club rosters on `/clubs/[slug]` need player data from somewhere. Academy admin CRUD is that source. Scouts just never see a global directory — they discover players inside a club page or via Starlive.

---

## i18n machinery cleanup (deferred 2026-04-28)

**Status:** All new code is English-only (per `feedback_no_translations` / `project_site_english_only`). Existing `t()` calls and `LanguageContext` machinery still in place.

**Cleanup scope:**

- Remove `src/context/LanguageContext.tsx`
- Remove `src/hooks/useLang.ts`
- Remove `src/lib/translations/`, `src/lib/server-translations.ts`
- Remove `_ka` paired DB columns (`name_ka`, `description_ka`, etc.) — separate migration
- Replace all `t('...')` call sites with hardcoded English
- Drop `lang` cookie handling in middleware/layouts
- Remove Noto Sans Georgian font load

**Why deferred:** Sweep-removal is mechanical but touches dozens of files. Doing it as a dedicated session prevents code-review noise mixed into feature PRs. Schedule after the new Clubs + Leagues + Chat surfaces ship.
