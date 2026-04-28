---
title: Phase 7 Redesign — Master Plan (Minimal Scout Surface)
type: refactor
status: active
date: 2026-04-28
supersedes:
  - 2026-04-28-audit-redesign-scope-reconciliation-plan.md
  - 2026-04-28-feat-clubs-schema-foundation-plan.md
  - 2026-04-28-feat-clubs-scout-surface-plan.md
  - 2026-04-28-feat-leagues-starlive-linkout-plan.md
  - 2026-04-28-refactor-chat-redesign-plan.md
  - 2026-04-28-refactor-demolish-scout-discovery-surface-plan.md
  - 2026-04-28-refactor-remove-i18n-machinery-plan.md
  - 2026-04-28-feat-academy-admin-club-customization-plan.md
  - 2026-04-28-refactor-warmth-pass-platform-surfaces-plan.md
---

# Phase 7 Redesign — Master Plan

Single source of truth for the Phase 7 platform redesign. Consolidates 9 originally-separate plans into one document. Each track below was a standalone plan; tracks share the same dependency graph and execution order they had as separate files.

---

## Enhancement Summary

**Deepened on:** 2026-04-28
**Tracks enhanced:** 9 (0 audit + 1–8 implementation)
**Agents run in parallel:** 10 (database-supabase, fullstack-nextjs, architecture-strategist, security-sentinel, performance-oracle, data-integrity-guardian, kieran-typescript-reviewer, code-simplicity-reviewer, best-practices-researcher, learnings-researcher)

### Top blockers surfaced — must be fixed before code starts

1. **Track 7 has 4 HIGH-severity blockers, not Track 6.** The plan says Track 7 column-drops are routine; recon proves they are *not*. Specifically:
   - `get_conversations_with_metadata` RPC (migration `..30`) selects `cl.name_ka` — will **crash chat inbox** at first call after the drop. Must be recreated WITHOUT `_ka` BEFORE `ALTER TABLE … DROP COLUMN`.
   - Migration `..33` issues a column-level `GRANT SELECT (id, club_id, name, name_ka, …, scouting_report_ka, …) ON players` — drop succeeds but the surviving GRANT must be re-issued or scouts silently lose column access.
   - Plan's `players._ka` column names are wrong: actual names are `name_ka` and `scouting_report_ka` — NOT `full_name_ka`/`bio_ka`.
   - Deploy-window race: drop schema → live frontend still selects `_ka` → 60–120s of broken pages on Vercel.
2. **Track 6 has 2 HIGH-severity blockers.** Watchlist table names in plan are wrong (actual: `watchlist`, `watchlist_folders`, `watchlist_folder_players`, `watchlist_tags` — plan said `watchlist_items`). And three demand RPCs reference `player_views` and survive `CASCADE` — they fail at next call. Must drop them explicitly.
3. **DO NOT delete `/api/players/search` in Track 6.** Chat's `PlayerSearchModal` (kept, used by academy admins) hits it. Gate to admin role; don't remove.
4. **Track 1 trigger has a service-role footgun.** `auth.uid()` is `NULL` under service role; the trigger as written would block legitimate platform-admin operations done via service-role client. Add a `service_role` bypass branch and a `NULL` guard.
5. **Track 4 file uploads have HIGH security gaps.** Client-only validation, no extension whitelist, MIME spoofing accepted by Supabase Storage. Must add server-side magic-byte sniff + extension allowlist + always derive `clubSlug` from session, never the caller.
6. **`Lang` type cleanup belongs to Track 5, not Track 7.** `chat-utils.ts`, `PlayerRefCard.tsx`, `PlayerSearchModal.tsx`, `admin/PlayerForm.tsx` all import `type { Lang } from '@/lib/translations'`. If Track 7 deletes that module before those files are stripped, build breaks.

### Top architecture corrections

- **Track 8 (Warmth Pass) should dissolve as a standalone track.** Split into (a) one tokens-and-utilities seed PR *before* Track 2, and (b) a per-surface warmth checklist embedded into Tracks 2/3/4/5 acceptance criteria. Standalone Track 8 produces predictable rework + duplicate review cycles.
- **Tracks 2 + 4 should ship as one PR.** Both touch the new clubs schema; merging avoids a stale window where the schema fields exist but no admin can populate them.
- **Tracks 6 + 7 are two phases of one cleanup, not two tracks.** Same destructive cleanup, distinct phases.
- **Track 0 is a discussion / decision document, not a track.** Promote to a "prereq checklist" in the Overview, drop the track-zero numbering.

### Top simplifications to apply (YAGNI cuts)

- Drop `tier_updated_at` column and the `enforce_tier_platform_admin_only()` trigger. Use **column-level GRANT** instead — `REVOKE UPDATE ON clubs FROM authenticated; GRANT UPDATE (logo_url, hero_photo_url, history_text, gallery_urls, description, website, updated_at) ON clubs TO authenticated;` — schema-level guarantee that authenticated users cannot touch `tier`. Also catches the security-sentinel finding F3 (RLS UPDATE allowed mutation of `slug`, `name`, etc. via direct PostgREST calls).
- Skip `@dnd-kit/core` for v1 gallery reorder. Up/down arrow buttons on each tile, ~10 LOC. Defer drag to v1.5 if requested.
- Skip Track 5 Phase A mockups — solo dev iterates on real code with hot reload + Playwright.
- Reduce Track 8's 9 sub-moves to 3 must-haves (typography, surface alternation + warm hero gradient, card hover lift). Defer pull-quotes, gradient meshes, dotted dividers, small caps on every metadata.

### Top patterns to standardize on

- `Result<T, E>` discriminated union for every server action and helper that can fail (single shared file `src/lib/result.ts`).
- `as const` arrays + `(typeof X)[number]` for closed enums (`AGE_GROUPS`, `POSITIONS`, `ASSET_KINDS`, `TIERS`).
- `satisfies z.ZodType<Partial<RowType>>` on every Zod schema mapped to a DB row.
- `Pick<Database['public']['Tables']['X']['Row'], …>` for component prop types — never hand-roll DTO interfaces.
- Type guards for untrusted input (URL params, FormData entries).
- `useActionState` + `useFormStatus` for forms (React 19 / Next 16 idiom).
- **`nuqs` library** for URL-state filters — de-facto 2026 standard, replaces ad-hoc `useSearchParams + router.replace` boilerplate.
- **Direct browser → Supabase Storage** via signed upload URLs for files; never route bytes through server actions (4MB body limit + double Vercel egress).
- **Snapshot player-ref data** into `messages.metadata` JSONB at send time, not live fetch — insulates from RLS changes and stale data.

### New considerations discovered

- Bundle baseline must be captured **before** Track 6 starts (`First Load JS` on `main`). Otherwise the post-demolition delta number is meaningless. Use `@next/bundle-analyzer` + GitHub Action `hashicorp/nextjs-bundle-analysis` for per-PR diffs.
- Storage object orphans need a concrete plan: short-term reconciliation SQL the platform admin runs quarterly; medium-term Supabase Edge Function on weekly cron deleting unreferenced objects with a 7-day grace window.
- The `clubs.tier` column should be `SECRET` (not in scout-facing query payloads). Use `REVOKE SELECT (tier)` + a public view `clubs_public` that omits it; ranking happens server-side via `ORDER BY tier DESC` then strips the column from the response.
- Approval-gate `/pending` page should show 3-checkpoint progress + an SLA estimate ("usually within 48h"). Silent waits cause >40% drop-off in approval-gated SaaS.
- All tracks should add `error.tsx` for new routes and structured logging in server actions (`{ action, userId, clubId, error }`).
- CLAUDE.md rewrite is a **hard prerequisite for Track 1**, not a wrap-up.

### Sources at a glance

- 10 parallel agent reviews (research + review).
- Codebase recon 2026-04-28 (49 migrations, 152 TS files, ~12,780 LOC).
- `docs/solutions/` learnings: prior comprehensive audit, watchlist migration template, chat polish, signed-URL expiry, RLS for chat, warm-dark theme system.
- `docs/brainstorms/`: warm-dark-redesign brainstorm has CardRedesign pattern (left border for category, hover shadow lift) — apply directly in Track 2.
- External: nuqs, `@dnd-kit/core`, ts-morph, `@next/bundle-analyzer`, Supabase Realtime 2026 patterns, NYT Magazine 2026 redesign references.

---

---

## Overview

Binocly is pivoting its scout-facing surface to a deliberate minimum: **Clubs, Leagues (link-out to Starlive), Messages**. Everything else scouts could see (player directory, profiles, dashboard, watchlist, comparison, PDF export, AI search, matches, schedule, standings) is being removed. Academy admins keep their player CRUD because the club pages need a real roster source. Starlive owns player/match/video discovery; Binocly owns paid club placement, club identity, and the scout↔academy chat thread.

This redesign also closes long-running debt:
- Strip the bilingual i18n machinery (site is English-only since 2026-04-15).
- Tear out the camera integration code (deferred to v2 — Starlive's API doesn't exist yet).
- Apply a "warmth pass" to the rebuilt surfaces to address the *hospital-vibes* feedback from the earlier UI migration.

The work is grouped into 9 tracks, executed in dependency order. Tracks 0 and 1 are foundational; 2–4 build the new surfaces; 5 redesigns chat; 6–7 do destructive cleanup; 8 polishes.

## Total scope at a glance

**Adds (new code):**
- `clubs.tier`, `clubs.hero_photo_url`, `clubs.history_text`, `clubs.gallery_urls` columns + RLS + tier-protection trigger.
- `club-assets` Supabase Storage bucket with per-slug folder policies.
- `/clubs` directory rewrite — paid-tier ranked.
- `/clubs/[slug]` detail rewrite — hero, photo gallery, history, age+position-filtered roster, message-academy button.
- `/leagues` page — three Starlive link-out buttons.
- `/admin/club/edit` — academy admin self-customization form (logo, hero, history, gallery).
- Chat moves from `/dashboard/messages` to `/messages` under `(platform)`.

**Deletes (removed code):**
- Routes: `(platform)/app/{clubs,leagues,players,schedule,standings}/`, top-level `/dashboard/`, `(shared)/leagues/`.
- Components: `src/components/{player,match,dashboard,forms}/*`, several `components/admin/Dashboard*` cards, `components/platform/{ClubMappingForm,PlayerMappingForm,SyncLogTable,SyncTrigger}.tsx`, `components/ui/LanguageToggle.tsx`.
- Lib: `src/lib/{ai-search,camera}/`, `src/hooks/useLang.ts`, `src/lib/server-translations.ts`, `src/lib/translations/*`, `src/context/LanguageContext.tsx`.
- API: `/api/{players,contact-requests,matches,camera,pixellot}/*`.
- Actions: `app/actions/{contact,watchlist,watchlist-folders,watchlist-tags,player-views?}.ts`.
- DB: `player_views`, `watchlist_*` tables; all `_ka` paired columns.

**Modifies (rewrites/edits):**
- Navbar — final scout link set: Clubs / Leagues / Messages.
- Middleware — drops `/` → `/players` redirect.
- 132 `t()` call sites + 129 `useLang()/getServerT()` references swept to hardcoded English.
- Chat components — visual redesign + `PlayerRefCard` rework (no `/players/[slug]` link).
- CLAUDE.md (separate edit, not scoped here) — reflects new minimal surface.

## Sequencing

```
Track 0 (Audit, blocking)
        │
        ▼
Track 1 (Schema migration + bucket)
        │
        ├──────────────────┐
        ▼                  ▼
Track 2 (Clubs surface)   Track 4 (Academy editor)
        │                  │
        └──────┬───────────┘
               ▼
        Track 3 (Leagues link-out)
               │
               ▼
        Track 5 (Chat redesign)  ← Phase A audit + design lock first, then implementation
               │
               ▼
        Track 6 (Demolition)     ← runs after new surfaces work
               │
               ▼
        Track 7 (i18n removal)   ← runs after demolition trims call-site count
               │
               ▼
        Track 8 (Warmth pass)    ← final polish before launch
```

Track 2 and Track 4 can run in parallel sessions if Andria splits work — they share Track 1's schema but touch different components.

## Reality vs Brief (consolidated)

The verbal redesign brief (Andria, 2026-04-28 session) describes a much smaller scout surface than what currently exists on disk. Recon revealed:

- **Two clubs routes:** `(platform)/clubs/page.tsx` (real, fetches DB) AND `(platform)/app/clubs/page.tsx` (hardcoded mock with `Beta` tag, leftover March platform-pivot scaffolding).
- **Top-level `/dashboard/`:** real and active. Has welcome card, leagues card, messages link, watchlist UI, notifications.
- **Approval gate:** `is_approved` flag, `(auth)/pending` page, demo-request funnel — load-bearing, Andria didn't restate but it stays.
- **Watchlist (replaces shortlist):** full UI + DB, descoped under the "no shortlist for scouts" framing.
- **Camera integration code:** built dormant. `(platform)/camera/`, `/api/camera/`, `lib/camera/`, sync UI. Andria's "v2 deferred" leaves the code orphaned.
- **Notifications + announcements + scout-demand RPCs:** all built, none mentioned in the brief.
- **132 `t()` calls + 129 `useLang/getServerT` references** — much bigger i18n cleanup than `MEMORY.md` suggested.
- **Bilingual DB columns:** `name_ka`, `description_ka`, etc. on multiple tables.
- **Middleware redirects logged-in `/` → `/players`** — conflicts with Andria's brief that scouts land on the landing page.

These are the inputs to Track 0's resolutions table.

## Default resolutions if Andria approves wholesale (from Track 0)

| # | Decision | Default |
|---|----------|---------|
| A1 | `(platform)/app/*` mocks | DELETE |
| A2 | `(shared)/leagues` marketing | DELETE |
| A3 | Top-level `/dashboard/` | DELETE; chat moves to `/messages` |
| A4 | Admin dashboard | SLIM — recent chats + roster shortcut |
| A5 | Approval gate | KEEP unchanged |
| B1 | Watchlist | DELETE |
| B2 | Notifications | KEEP infra, scope to chat + transfer |
| B3 | Announcements | KEEP |
| B4 | Demo requests | KEEP unchanged |
| B5 | View tracking + scout demand cards | DELETE |
| B6 | AI search | DELETE |
| B7 | Camera integration code | DELETE |
| B8 | Platform admin | KEEP minus camera |
| C1 | Login redirect | FIX — no redirect from `/` for logged-in |
| C2 | Logged-in landing | Same page, subtle CTA swap via `useAuth()` |
| C3 | `_ka` columns | DROP in i18n cleanup migration |

---

# Track 0 — Scope Reconciliation Audit (BLOCKING)

**Purpose:** resolve every gap between Andria's verbal redesign brief (this session) and the actual codebase state, *before* any code begins. This is a discussion document, not an implementation track.

## Section A — Routes that exist but Andria didn't mention

### A1. `(platform)/app/{clubs,leagues,players,schedule,standings}` — hardcoded mocks

5 page files exist with inline `const FOO = [...]` arrays of fake data and `Beta` tags. Holdovers from March "platform pivot" sessions — scaffolding never filled in.

**Decision:** delete entire `(platform)/app/` subtree.

**Alternatives:** repurpose as the new scout shell; other.

### A2. `(shared)/leagues/page.tsx` — public marketing leagues page

Accessible to everyone (logged in or not). Conflicts with `feedback_no_world_bridge.md` if logged-in users hit it via the nav.

**Decision:** delete the public marketing version.

**Alternative:** keep it public, gate logged-in nav so it routes to the new platform `/leagues` link-out instead.

### A3. Top-level `/dashboard/` (scout dashboard)

Real. Includes `dashboard/page.tsx` (welcome + leagues card + messages link), `dashboard/messages/`, sidebar with watchlist/notifications/activity feed. Andria said "scouts don't have Dashboard, exactly, they land on the landing page."

**Decision:** delete `/dashboard/` entirely. Move chat to `/messages` under `(platform)`.

**Alternatives:** keep `/dashboard/` as a thin landing (welcome + nav); other.

### A4. Top-level `/admin/` (academy admin home)

Real. `/admin/page.tsx` is a dashboard with stat cards, quick actions, scout activity, scout demand cards, player views. Andria said "academy admins need to manage their club and reply to the chat" — implies admin side stays.

**Decision:** slim to a minimal admin home (welcome + recent chats + roster shortcut). Player views/scout demand cards deleted (depends on B5).

**Alternative:** keep current dashboard with all its cards.

### A5. `(auth)/pending/page.tsx` and approval gate

Real. Scouts register → `is_approved=false` → land on `/pending` → wait for platform admin to approve via `/platform/demo-requests` → `is_approved=true` → access platform. Load-bearing manual subscription/quality control mechanism.

**Decision:** keep the approval gate as-is.

## Section B — Features that exist but Andria didn't mention (kill-or-keep)

### B1. Watchlist (replaces old shortlist)

Files: `src/components/dashboard/{WatchlistPage,WatchlistPanel,WatchlistPlayerRow,WatchlistSidebar}.tsx`, `src/components/player/WatchButton.tsx`, `src/app/actions/{watchlist,watchlist-folders,watchlist-tags}.ts`.

**Decision:** delete watchlist (consistent with no shortlist).

### B2. Notifications system

`notifications` table, `lib/notifications/{create,types}.ts`, `components/layout/{NotificationBell,NotificationDropdown,NotificationItem}.tsx`, `components/dashboard/NotificationList.tsx`, API route `/api/notifications/`.

**Decision:** keep notification infrastructure (DB, helpers, bell in nav). Delete the dashboard list. Scope notifications to chat unread + transfer events only.

### B3. Announcements (academy posts)

`academy_announcements` table, `components/admin/{AnnouncementForm,AnnouncementList}.tsx`, `components/club/ClubAnnouncements.tsx` (visible on club page), `/admin/announcements/`.

**Decision:** keep — fits the new clubs-as-the-product framing.

### B4. Demo requests + landing demo form

`/demo` page, `demo_requests` table, alert emails to Andria via Resend, platform admin reviews at `/platform/demo-requests`. The approval-gate intake funnel.

**Decision:** no change.

### B5. Scout demand / player views / admin dashboard cards

Player view tracking writes to `player_views`. Admin dashboard renders `DashboardPlayerViews`, `ScoutDemandCard`, `DashboardScoutActivity`. If scouts no longer have a global player directory, the only place a scout views a player is via club page rosters — view counts collapse to roster-impression level.

**Decision:** delete view tracking + the three admin cards. Replace admin dashboard with simpler "recent chat threads + roster summary."

### B6. AI search

Built. `src/lib/ai-search/{prompt,service,types}.ts`, `src/components/player/{AISearchBar,AIFilterTags}.tsx`. Andria's brief: AI search is killed.

**Decision:** delete.

### B7. Camera integration code (currently dormant)

Partly built. `(platform)/camera/` admin UI, `/api/camera/{webhook,sync}/`, `/api/pixellot/`, `src/lib/camera/{client,extract,sync,transform,types,validations}.ts`, `components/platform/{ClubMappingForm,PlayerMappingForm,SyncLogTable,SyncTrigger}.tsx`. Migrations `..41,42,43`. Sit dormant — no real Pixellot credentials wired.

**Decision:** delete. When v2 starts, rebuild from scratch with whatever API Starlive eventually exposes.

### B8. Top-level `/platform/` (platform admin)

Manages all clubs, leagues, players, scouts, requests, transfers, demo requests, invite, camera. Uses `getPlatformAdminContext()`.

**Decision:** drop `/platform/camera/` (per B7). Drop `/platform/players/` *new* / *edit* if redundant with `/admin/players` of any academy. Otherwise keep.

## Section C — Mismatches in framing

### C1. Login destination

`middleware.ts` redirects logged-in users from `/` to `/players`. With `/players` killed, this becomes a 404. Andria said scouts land on the landing page.

**Decision:** fix middleware — don't redirect logged-in users from `/`. Landing's nav (`useAuth()`) shows logged-in state with platform CTAs.

### C2. Logged-in landing CTAs

If logged-in scouts land on `/`, what changes?
- Hero CTAs ("Get Started" → "Browse Clubs"?)
- "Request Demo" hidden
- "Sign in" → "Account / Logout"

**Decision:** logged-in landing has subtly different CTAs (clubs/messages) but otherwise identical copy. Minimal divergence.

### C3. Bilingual DB columns

Tables have `name`, `name_ka`, `description`, `description_ka`. ClubCard reads both.

**Decision:** drop all `_ka` columns in a migration during the i18n cleanup pass (Track 7).

## Section D — Open design questions

- **D1.** The three Starlive Leagues URLs + button labels. Tracked in `Haveinmind.md`.
- **D2.** Club ranking tiebreaker. Tracked in `Haveinmind.md`. Default to alphabetical for v1.
- **D3.** Chat redesign direction. Track 5's Phase A produces 2–3 mockups; Andria picks before implementation.
- **D4.** "Clubs design their own page" — v1 fields. Tracked in `Haveinmind.md`. v1 proposed: logo, hero photo, history text (plain), photo gallery (≤12 images).

## Track 0 acceptance criteria

- [ ] Andria reviews Sections A–C and either accepts the defaults table wholesale or marks specific items with alternatives.
- [ ] Resolutions recorded back into `MEMORY.md` under "Phase 7 Resolutions" section.
- [ ] Any item that becomes a deferred decision gets a `Haveinmind.md` entry.
- [ ] Tracks 1–8 unblocked.

### Research Insights

**Hidden cross-track dependencies the original plan missed:**

- **`Lang` type is the silent build-breaker.** `chat-utils.ts`, `PlayerRefCard.tsx`, `PlayerSearchModal.tsx`, and `admin/PlayerForm.tsx` all `import type { Lang } from '@/lib/translations'`. Track 7 deletes that module — but those files are kept (chat + admin player CRUD). Move the `Lang`-type strip into Track 5 acceptance ("no imports from `@/lib/translations` remain") so Track 7 can safely delete the directory.
- **Track 4 needs `database.types.ts` from Track 1 committed.** State explicitly: "Track 4 begins only after Track 1's regenerated types are merged." Otherwise the server action fails type-check on first run.
- **Track 6 must NOT delete `/api/players/search`.** Chat's `PlayerSearchModal` (kept) hits it. Either keep the route gated to `role='academy_admin'`, or move to `/api/admin/players/search`. Plan currently lists it for deletion — this is a blocker.
- **CLAUDE.md update is a hard prerequisite for Track 1**, not a wrap-up. Promote it into the Overview prereq checklist.

**Pattern compliance gaps:**

- `getAdminContext()` should throw or `redirect()` rather than return null — verify semantics before Track 4 relies on it.
- Server-side check that uploaded gallery URLs start with the project's storage public URL prefix for the admin's own slug. Zod validates shape, not host.
- `STARLIVE_LEAGUE_LINKS` (Track 3) should be env vars if URLs differ across staging/prod — `lib/constants.ts` is correct only when URLs are identical across environments.

**From past institutional knowledge:**

- `docs/solutions/security-issues/comprehensive-audit-security-code-quality-fixes.md` — 8-agent audit pattern produced 44 findings. Reuse this approach as a checklist item in Track 0 + Track 6 (search for: unreachable routes, unused components, dead translation keys, always-false state, client components that don't need client JS, unused API routes).
- `docs/solutions/feature-migrations/shortlist-to-watchlist-system-migration.md` — full migration template (pre-audit count, post-audit count, FK constraint name updates, grep verification). Adopt for Track 1 and Track 6.

**Risk concentration revised:**

Track 7 is the highest-risk track, not Track 6. Track 6 deletes whole subtrees that `npm run build` catches; Track 7 sweeps 132 call sites + 129 hook references and drops DB columns. The compiler catches hook removals but **not** stale `t('foo.bar')` calls inside template strings or conditional ternaries that resolve to `undefined`. Mitigation: a CI grep gate (`grep -rn "_ka\b" src/ | wc -l` MUST equal zero) BEFORE Phase D's column drop, not after.

---

# Track 1 — Clubs Schema Foundation

## Overview

Add the database fields that power the redesigned scout-facing clubs surface and academy-admin self-customization. One migration, one type regen, one RLS update, one storage bucket. Everything else builds on this.

## Reality vs Brief

- ✅ `clubs` table exists with `id, name, name_ka, slug, logo_url, city, region, description, description_ka, website, created_at, updated_at`.
- ❌ No `tier`, `hero_photo_url`, `history_text`, `gallery_urls` columns.
- ❌ No `club-assets` storage bucket.
- ⚠️ `_ka` columns will be dropped in Track 7 — *not* this one.

## Migration: `20250101000050_clubs_v2_redesign.sql`

```sql
-- Phase 7 redesign: paid-tier ranking + customizable club page fields

ALTER TABLE clubs
  ADD COLUMN tier integer NOT NULL DEFAULT 0,
  ADD COLUMN tier_updated_at timestamptz,
  ADD COLUMN hero_photo_url text,
  ADD COLUMN history_text text,
  ADD COLUMN gallery_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN clubs.tier IS 'Paid tier for /clubs directory ordering. Higher = ranked higher. 0 = unpaid/default.';
COMMENT ON COLUMN clubs.tier_updated_at IS 'When tier last changed — for audit/billing reconciliation.';
COMMENT ON COLUMN clubs.hero_photo_url IS 'Full-bleed banner image for club detail page. Optional.';
COMMENT ON COLUMN clubs.history_text IS 'Long-form club history shown on detail page. Plain text.';
COMMENT ON COLUMN clubs.gallery_urls IS 'Ordered list of club photo URLs.';

CREATE INDEX clubs_tier_idx ON clubs(tier DESC, name ASC);

DROP POLICY IF EXISTS "Academy admin updates own club" ON clubs;
CREATE POLICY "Academy admin updates own club" ON clubs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'academy_admin'
        AND profiles.club_id = clubs.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'academy_admin'
        AND profiles.club_id = clubs.id
    )
  );

CREATE OR REPLACE FUNCTION enforce_tier_platform_admin_only()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    ) THEN
      RAISE EXCEPTION 'Only platform_admin can change clubs.tier';
    END IF;
    NEW.tier_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clubs_tier_protection ON clubs;
CREATE TRIGGER clubs_tier_protection
  BEFORE UPDATE OF tier ON clubs
  FOR EACH ROW EXECUTE FUNCTION enforce_tier_platform_admin_only();
```

## Storage bucket: `club-assets`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-assets',
  'club-assets',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Academy admin manages own club assets" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'club-assets'
    AND EXISTS (
      SELECT 1 FROM profiles p
      JOIN clubs c ON c.id = p.club_id
      WHERE p.id = auth.uid()
        AND p.role = 'academy_admin'
        AND (storage.foldername(name))[1] = c.slug
    )
  );

CREATE POLICY "Anyone can view club assets" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'club-assets');
```

**Path convention:** `club-assets/<club-slug>/{logo,hero,gallery/<uuid>}.<ext>`

## Decisions

- **Gallery as `text[]` not separate table.** Simpler, fits v1 (≤12 images cap). Migrate to `club_gallery_images` table later if metadata needed.
- **`history_text` plain text, no markdown.** Safe by default. Renderer splits on `\n\n` paragraphs. Markdown is v2.
- **`tier` integer not enum.** Flexible; no CHECK constraint until pricing is finalized.
- **`tier_updated_at` column present.** Useful for billing reconciliation.
- **Tier writes blocked at trigger level**, more robust than RLS WITH CHECK.

## System-wide impact

- **Interaction graph:** updating `tier` triggers `clubs_tier_protection` → updates `tier_updated_at`.
- **Error propagation:** trigger raises Postgres exception on unauthorized tier write — surfaces in academy admin's edit form. Friendly error mapping needed in form layer.
- **State lifecycle risk:** academy admin uploads gallery image, client times out before saving URL → orphaned storage object. Mitigation: tracked in `Haveinmind.md` as low-priority cleanup script.
- **API surface parity:** `/api/clubs/[slug]` returns full club row — new fields appear automatically.

## Track 1 acceptance criteria

- [ ] Migration `20250101000050_clubs_v2_redesign.sql` applied via `npx supabase db push`.
- [ ] `database.types.ts` regenerated and committed.
- [ ] Storage bucket `club-assets` exists with policies.
- [ ] Manual smoke (academy admin): update `history_text` succeeds; update `tier` fails with trigger error.
- [ ] Manual smoke (platform admin): update `tier` succeeds, `tier_updated_at` ticks.
- [ ] Existing `/clubs` page still renders (new columns ignored gracefully).
- [ ] All existing clubs backfilled with `tier=0` (default handles this).

### Research Insights

**Trigger function hardening (HIGH severity — fix before applying):**

The `enforce_tier_platform_admin_only()` trigger as written has three issues:

1. **`auth.uid()` is `NULL` under service role** → trigger blocks legitimate platform-admin operations done via service-role client. Add a `service_role` bypass branch:

```sql
IF NEW.tier IS DISTINCT FROM OLD.tier THEN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    NEW.tier_updated_at = now();
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin'
  ) THEN
    RAISE EXCEPTION 'Only platform_admin can change clubs.tier'
      USING ERRCODE = '42501';
  END IF;
  NEW.tier_updated_at = now();
END IF;
```

2. **Missing `SECURITY DEFINER` + `SET search_path = public, pg_temp`.** Without `SET search_path`, a malicious schema can hijack the trigger. The Supabase linter will flag this.
3. **`ERRCODE 42501`** lets the form layer pattern-match a real Postgres error code instead of string-sniffing the message.

**Better pattern: replace the trigger with column-level GRANT (3-layer defense):**

```sql
REVOKE UPDATE ON clubs FROM authenticated;
GRANT UPDATE (logo_url, hero_photo_url, history_text, gallery_urls, description, website, updated_at)
  ON clubs TO authenticated;
```

This gives a **schema-level guarantee** that authenticated users cannot ever touch `tier`, `slug`, `name`, `created_at`, `id`. Keep the trigger only for `tier_updated_at` bookkeeping.

**Security-sentinel finding F3 (HIGH):** the RLS UPDATE policy is column-agnostic. Without column-GRANT, an academy admin can issue a direct PostgREST call `supabase.from('clubs').update({slug: 'spoof', name: 'spoof'})` and the policy passes — only `tier` is trigger-blocked. Column-GRANT closes this.

**Security findings on storage:**

- F1 (HIGH) — slug-shaped path traversal: add `CHECK (slug ~ '^[a-z0-9-]+$')` to `clubs.slug` and a regex CHECK on `storage.objects.name` matching `^[a-z0-9-]+/(logo|hero|gallery/[a-f0-9-]+)\.(jpe?g|png|webp)$`.
- F2 (MEDIUM) — bucket policy `FOR ALL` is too broad. Split into separate INSERT/UPDATE/DELETE policies, drop the redundant SELECT policy under `public: true`.
- F4 (MEDIUM) — bucket-list/object-list APIs may enumerate. Verify in Supabase Dashboard that anon `LIST` returns 403.

**Data-integrity additions (CHECK constraints to add now):**

```sql
ALTER TABLE clubs
  ADD CONSTRAINT clubs_tier_range CHECK (tier >= 0 AND tier <= 10),
  ADD CONSTRAINT clubs_gallery_size CHECK (cardinality(gallery_urls) <= 12),
  ADD CONSTRAINT clubs_hero_url_format CHECK (hero_photo_url IS NULL OR hero_photo_url ~ '^https?://');
```

**Idempotency:** plan's `ALTER TABLE ... ADD COLUMN` and `CREATE INDEX` are not re-runnable. Use `ADD COLUMN IF NOT EXISTS` (Postgres 9.6+) and `CREATE INDEX IF NOT EXISTS`. The trigger creation already does `DROP TRIGGER IF EXISTS` — match that for storage policies (`DROP POLICY IF EXISTS` before `CREATE POLICY`).

**`text[]` vs `jsonb` for gallery — reconsider:**

At 3 clubs × ≤12 photos, `text[]` is fine. **However**, Track 8's warmth pass implies accessibility (alt text). Adding alt text to a `text[]` requires a migration to `jsonb[]` or join table. Cheaper now: store as `jsonb NOT NULL DEFAULT '[]'::jsonb` with shape `[{url, alt, caption?}]`. Same simplicity, future-proofs alt text + caption + ordering metadata. **Decide before Track 1 lands.**

**Open question to resolve:** `description` (short tagline, kept) vs `history_text` (long narrative, new). Decide whether `description` is what `ClubCard` displays vs whether the card pulls a slice of `history_text` — otherwise admins fill both inconsistently.

**YAGNI cuts (code-simplicity-reviewer):**

- `tier_updated_at` column is YAGNI — no billing system exists yet. `updated_at` already exists on the row. Counter-view: harmless cost (one column + one trigger line) and useful when subscription tier-changes start. Keep IF you adopt the column-GRANT pattern (which removes the trigger anyway). If you keep the trigger, also keep `tier_updated_at`.
- The trigger itself is YAGNI per code-simplicity, but the security-sentinel makes the case for keeping it OR replacing with column-GRANT. Recommended: replace with column-GRANT.

**Storage orphan cleanup (concrete):**

Short-term reconciliation SQL the platform admin runs quarterly:

```sql
SELECT o.name FROM storage.objects o
WHERE o.bucket_id = 'club-assets'
  AND NOT EXISTS (
    SELECT 1 FROM clubs c
    WHERE c.hero_photo_url LIKE '%' || o.name
       OR c.logo_url       LIKE '%' || o.name
       OR EXISTS (SELECT 1 FROM unnest(c.gallery_urls) g WHERE g LIKE '%' || o.name)
  );
```

Medium-term: Supabase Edge Function on weekly cron, deletes orphans older than 7 days. Add a `Haveinmind.md` entry: "Phase 7 storage orphan cleanup script — write before /clubs has 100+ uploads."

**Sources:**
- [Column Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [Supabase RLS in Production: Patterns That Actually Work](https://dev.to/whoffagents/supabase-row-level-security-in-production-patterns-that-actually-work-2l78)
- [PostgreSQL: Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- Existing `supabase/migrations/20250101000033_protect_guardian_contact.sql` (column-level GRANT precedent already in this codebase).

---

# Track 2 — Scout-Facing Clubs Surface

## Overview

Rebuild `/clubs` (directory) and `/clubs/[slug]` (detail) as the primary scout discovery surface. Replaces the player-directory-centric model. Powered by Track 1's schema.

## Reality vs Brief

- ✅ `(platform)/clubs/page.tsx` — real, fetches DB. Will be rewritten.
- ✅ `(platform)/clubs/[slug]/page.tsx` — real, uses `ClubDetailClient`. Will be rewritten.
- ✅ `components/club/{ClubCard, ClubDetailClient, ClubAnnouncements}.tsx` exist.
- ✅ `components/chat/MessageAcademyButton.tsx` exists.
- ⚠️ Current code uses `getServerT()` and `t('clubs.title')`. Strip in this track (sets the English-only precedent).
- ⚠️ Current `ClubCard` reads `name_ka, description_ka`. Strip — site is English-only.
- ⚠️ Apply `feedback_ui_redesign_hospital.md` warmth direction.

## Routes

```
src/app/(platform)/clubs/
  page.tsx              → directory (rewrite)
  loading.tsx           → kept
  [slug]/
    page.tsx            → detail (rewrite)
    loading.tsx         → add if missing
    not-found.tsx       → add (graceful 404)
```

## `/clubs` directory rewrite

**Server component.** Query:

```ts
const { data: clubs } = await supabase
  .from('clubs')
  .select(`
    id, slug, name, logo_url, hero_photo_url, city, region, description, tier,
    players(count)
  `)
  .order('tier', { ascending: false })
  .order('name', { ascending: true })
```

**Layout:**
- Page hero: short editorial intro using real market numbers (37,600+ youth players, 100+ clubs).
- Grid: 1 col mobile, 2 col tablet, 3 col desktop.
- ClubCard variants by tier: subtle visual differentiation (gold edge for `tier ≥ 1`).
- Empty state: graceful but not expected at runtime.

## `/clubs/[slug]` detail rewrite

**Server component, loads:**

```ts
const { data: club } = await supabase
  .from('clubs')
  .select(`
    id, slug, name, logo_url, hero_photo_url, city, region,
    description, history_text, gallery_urls, website,
    profiles!profiles_club_id_fkey(id, full_name)
  `)
  .eq('slug', slug)
  .single()

const { data: players } = await supabase
  .from('players')
  .select('id, full_name, slug, position, date_of_birth, photo_url, jersey_number')
  .eq('club_id', club.id)
  .order('jersey_number', { ascending: true })
```

If `club` is null → `notFound()`.

**Layout:**
1. **Hero band** — full-bleed `hero_photo_url` (or fallback warm gradient using primary), club logo overlay, club name + city + region.
2. **Info row** — three small stats: founded year (TBD), squad size, region.
3. **About** — `description` short tagline + `history_text` long narrative (paragraph-split).
4. **Photo gallery** — `gallery_urls` rendered as horizontal scroll or grid; lightbox on click.
5. **Roster** — filter bar (age group + position) + roster grid.
6. **Announcements** (kept per audit B3) — `<ClubAnnouncements />`.
7. **Sticky footer / floating button** — `<MessageAcademyButton />`.

## Roster filter component

**Client component** `ClubRosterFilter.tsx`:

```tsx
type Props = { players: PlayerSummary[] }

export function ClubRosterFilter({ players }: Props) {
  const [ageGroup, setAgeGroup] = useState<'all' | 'U15' | 'U17' | 'U19'>('all')
  const [position, setPosition] = useState<'all' | 'GK' | 'DEF' | 'MID' | 'ATT'>('all')

  const filtered = players.filter(p => {
    if (ageGroup !== 'all' && computeAgeGroup(p.date_of_birth) !== ageGroup) return false
    if (position !== 'all' && p.position !== position) return false
    return true
  })

  return (...)
}
```

**Age group computation:** age as of `Aug 1` of current season year (FIFA convention). Centralize in `lib/utils.ts` as `computeAgeGroup(dob)`.

**Filter state in URL search params** (`?age=U17&pos=MID`) — shareable, bookmarkable.

## Roster card design

**Critical: roster cards do NOT link to `/players/[slug]`.** Players have no public profile route.

- Render player name, jersey number, position, age, photo. No click action.
- Optional subtle line beneath roster: "Player profiles coming via Starlive once integration ships." (Andria's call.)

## Message Academy wiring

`MessageAcademyButton` already exists. Pass `academyAdminId` (the club's first academy_admin profile.id) and `clubName`. On click → opens chat thread.

**Edge case:** club has no academy_admin profile yet → button disabled with tooltip "This academy hasn't onboarded yet — check back soon."

## Navbar update

- Center links: **Clubs / Leagues / Messages**.
- Active state on `/clubs/...` highlights "Clubs".
- Strip Players/Watchlist/Dashboard links.
- `useAuth()` continues to drive logged-in vs logged-out variants.
- `LanguageToggle` import removed (Track 7 deletes the component).

## Middleware fix (audit C1)

`src/middleware.ts`: remove the `/` → `/players` redirect for logged-in users. They see the landing.

## UI warmth (addressing `feedback_ui_redesign_hospital.md`)

Concrete moves:
- **Surface variation:** alternate `--surface` and `--background` between sections.
- **Subtle texture:** noise overlay or paper texture on hero band (CSS-only SVG filter).
- **Serif accents:** Noto Serif (already loaded for landing) for hero headline + section titles inside `(platform)/clubs/`.
- **Drop caps** on `history_text` first paragraph (`::first-letter`).
- **Tier-1+ clubs** get a faint gold edge highlight on their card.
- **Empty hero** uses a warm gradient using `--primary` at low opacity, not a placeholder image.

## System-wide impact

- **Interaction graph:** ClubCard click → server query → render → client filter → no further nav. Message button → POST `/api/conversations` → redirect to `/messages/[conversationId]`.
- **Error propagation:** DB failure → ErrorBoundary; slug not found → `not-found.tsx`; message POST fail → toast + retry.
- **State lifecycle:** filter state in URL, no orphan state.
- **API surface parity:** strip `/api/clubs/*` if only used by old detail page (verify at impl time).

### Integration test scenarios

1. Anonymous → `/clubs` → 401 (middleware redirects to login).
2. Approved scout → `/clubs` → sees clubs ordered tier desc, name asc.
3. Click into `Iberia 1999` → detail page shows history + roster.
4. Filter age=U17, pos=MID → only U17 midfielders visible.
5. Click "Message Academy" → conversation created/opened with academy admin.
6. Club has no admin → button disabled with tooltip.
7. Direct URL `/clubs/nonexistent-club` → 404.
8. Tier=2 club appears above tier=0 club regardless of name.

## Track 2 acceptance criteria

- [ ] `/clubs/page.tsx` rewritten — tier-ordered grid, English copy, warmth applied.
- [ ] `ClubCard.tsx` rewritten — no `_ka` reads, no `t()`.
- [ ] `/clubs/[slug]/page.tsx` rewritten — hero, about, gallery, roster, message button, optional announcements.
- [ ] `ClubDetailClient.tsx` rewritten or replaced.
- [ ] `ClubRosterFilter.tsx` new — URL-search-param filter state.
- [ ] `lib/utils.ts` exports `computeAgeGroup(dob)`.
- [ ] `not-found.tsx` for slug → 404.
- [ ] No links to `/players/[slug]` from anywhere on the new surface.
- [ ] Navbar updated — center links: Clubs / Leagues / Messages.
- [ ] Middleware fix (audit C1) applied.
- [ ] `npm run build` clean.
- [ ] Manual smoke on real DB: 3 clubs render, filter works, message button opens thread.

### Research Insights

**Filter state — `useState` is the wrong primitive.** Plan promises URL-state filters but the snippet uses `useState`. Two options:

1. **`nuqs` library (de-facto 2026 standard):**
   ```tsx
   const [position, setPosition] = useQueryState('pos',
     parseAsArrayOf(parseAsString).withDefault([]))
   ```
   Server components read the same shape via `loadSearchParams()`. Single source of truth across server fetch and client UI. Wrap root layout in `<NuqsAdapter>`. Use `throttleMs: 200` for slider-driven filters, `shallow: false` only when server refetch is needed.

2. **Native Next 16 + `useTransition`:**
   ```tsx
   const params = useSearchParams()
   const [isPending, startTransition] = useTransition()
   const setParam = (key, value) => {
     const next = new URLSearchParams(params)
     value === 'all' ? next.delete(key) : next.set(key, value)
     startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }))
   }
   ```

For 1–2 params, native is fine. Past 2 params, nuqs wins decisively.

**Server-side filter via Next 16 `searchParams` Promise:**

For the truly idiomatic 2026 pattern, push filtering into the server query: read `searchParams` from the server component (`await props.searchParams`), filter via Postgres, pass already-filtered list down. Client component only owns form controls. Defer until roster size warrants — at 30 players client-side is fine. **Threshold: ~150–200 players per club** before client filter shows up in profiling.

**Type derivation — never hand-roll `PlayerSummary`:**

```ts
import type { Database } from '@/lib/database.types'

export type RosterPlayer = Pick<
  Database['public']['Tables']['players']['Row'],
  'id' | 'full_name' | 'slug' | 'position' | 'date_of_birth' | 'photo_url' | 'jersey_number'
>

export const AGE_GROUPS = ['U15', 'U17', 'U19'] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]

export const POSITIONS = ['GK', 'DEF', 'MID', 'ATT'] as const
export type Position = (typeof POSITIONS)[number]

const isAgeFilter = (v: string | null): v is AgeGroup | 'all' =>
  v === 'all' || (AGE_GROUPS as readonly string[]).includes(v ?? '')
```

**`computeAgeGroup` signature must handle `string | null`** (Supabase nullable column):

```ts
export function computeAgeGroup(dob: PlayerRow['date_of_birth']): AgeGroup | null {
  if (!dob) return null
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  // FIFA convention: age as of Aug 1 of current season year
  const seasonStart = new Date(new Date().getFullYear(), 7, 1)
  const age = seasonStart.getFullYear() - birth.getFullYear()
  if (age <= 15) return 'U15'
  if (age <= 17) return 'U17'
  if (age <= 19) return 'U19'
  return null
}
```

**Performance — collapse the `/clubs/[slug]` query to one round trip:**

Plan currently does 4 sequential queries. Use PostgREST embedded relations:

```ts
const [clubResult, userResult] = await Promise.all([
  supabase.from('clubs').select(`
    id, slug, name, logo_url, hero_photo_url, city, region,
    description, history_text, gallery_urls, website,
    profiles!profiles_club_id_fkey(id, full_name),
    players(id, slug, full_name, position, date_of_birth, photo_url, jersey_number),
    academy_announcements(id, content, created_at)
  `).eq('slug', slug).single(),
  supabase.auth.getUser(),
])
```

**Estimated win: ~80–120ms TTFB.** Combined with `cached-auth.ts` for the user-role fetch, eliminates a second profile query for warm sessions. Cap embedded relations: `academy_announcements(id, content, created_at).limit(5).order(created_at.desc, ...)`.

**Directory query — `players!inner(count)` with status filter:**

```ts
.select(`id, slug, name, logo_url, hero_photo_url, city, region, description, tier,
         players!inner(count).eq(status, 'active')`)
```

Released/free-agent rows don't inflate the count. **Estimated win: ~100kb payload + ~50ms TTFB at 100 clubs.**

**`next/image` config (2026 idioms):**

- Hero on detail page: `<Image fill priority sizes="100vw" placeholder="blur" blurDataURL={...} />`. Generate `blurDataURL` at upload time with `plaiceholder`, persist alongside `hero_photo_url`. Don't generate per-request.
- Hero on directory cards: NO `priority` (below the fold).
- Card images: `sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"`.
- Gallery: lazy by default; lightbox fetches full-res on demand.
- Add `next.config.ts` `images.remotePatterns` for the Supabase Storage host.

**Caching:** `export const revalidate = 60` on `/clubs`, `revalidate = 30` on `/clubs/[slug]`. Server action `revalidatePath('/clubs/${slug}')` triggers on-demand bust when academy edits.

**Apply CardRedesign pattern from `docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md`:** left border for category (replaces top border), hover shadow lift, layered depth. Don't defer card polish to Track 8 — apply it directly in Track 2.

**Mobile `100dvh`** — chat thread containers and any full-height Track 2 containers must use `100dvh` not `100vh` (mobile browsers' address bar makes `100vh` overflow). From `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`.

**Anti-patterns to call out:**

- `useEffect` to fetch club data — RSC-fetchable, plan does this right; keep it.
- `'use client'` on `ClubProfileForm`'s parent route — page is server, only the form is client island.
- `revalidateTag` here — no tags set; `revalidatePath` is right.
- Sharing Supabase clients across requests in server actions — fresh `await createClient()` per action call.
- `useState` shadowing URL state — pick one (URL) and read from it.

**Sources:**
- [nuqs docs](https://nuqs.dev/) · [GitHub: 47ng/nuqs](https://github.com/47ng/nuqs)
- [Next.js Image Component API (2026)](https://nextjs.org/docs/app/api-reference/components/image)
- [Aurora Scharff — Managing Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)
- `src/lib/cached-auth.ts` — reuse for user-role fetch

---

# Track 3 — Leagues Page (Starlive Link-Out)

## Overview

Replace existing leagues placeholders with a single platform-only `/leagues` page with three big buttons redirecting scouts to Starlive's website. No data ingest, no live scores.

## Reality vs Brief

- ❌ Three Starlive URLs not yet known (`Haveinmind.md`).
- ❌ Three button labels not yet known.
- ⚠️ `feedback_no_world_bridge.md`: logged-in `/leagues` must be platform-only, not public marketing.

## Route

```
src/app/(platform)/leagues/page.tsx
```

Server component, no DB query, auth-gated by `(platform)/layout.tsx`.

## Layout

1. **Hero band** — short editorial intro: "League data lives at Starlive — our partner camera and video network across Georgian football."
2. **Three big cards** — each card:
   - Title (e.g. "U-19 Premier League").
   - One-line subtitle (e.g. "12 clubs · season 2025/26").
   - Visual: subtle illustration or color block.
   - Hover: lift + arrow icon shifting right.
   - `target="_blank" rel="noopener noreferrer"`.
   - Small "External — opens Starlive" label.
3. **Footer note** (optional) — "Want match data inside Binocly? It's coming."

## URLs and labels

`src/lib/constants.ts`:

```ts
export const STARLIVE_LEAGUE_LINKS = [
  { id: 'u19-premier', label: 'U-19 Premier', subtitle: 'TBD', url: 'https://starlive.example/u19' },
  { id: 'u17-premier', label: 'U-17 Premier', subtitle: 'TBD', url: 'https://starlive.example/u17' },
  { id: 'u15-premier', label: 'U-15 Premier', subtitle: 'TBD', url: 'https://starlive.example/u15' },
] as const
```

Real URLs come from Andria/Starlive — see `Haveinmind.md`.

## Component

Inline `<a>` anchors with `rel="noopener noreferrer"` and `target="_blank"`. KISS — no separate component file for three rendering.

## Empty state / fallback

If env vars or constants are missing → "Coming soon — leagues data is being wired up with our camera partner Starlive."

## System-wide impact

- **Interaction graph:** click → new tab to Starlive.
- **Error propagation:** Starlive 404 is their problem; Binocly tab survives.
- **State lifecycle risks:** none — read-only static page.
- **API surface parity:** none — no API.

### Integration test scenarios

1. Logged-in scout → `/leagues` → sees three cards.
2. Clicks card → new tab opens, target URL loads.
3. Anonymous → `/leagues` → middleware redirects to `/login`.
4. Pending scout → `/leagues` → middleware redirects to `/pending`.
5. View source → no `Pixellot` references in HTML.

## Track 3 acceptance criteria

- [ ] `src/app/(platform)/leagues/page.tsx` exists, server component, no DB, no `t()`.
- [ ] `src/lib/constants.ts` has `STARLIVE_LEAGUE_LINKS` with placeholder URLs and TODO pointing to `Haveinmind.md`.
- [ ] Three cards render with title + subtitle + external arrow.
- [ ] All anchors have `target="_blank" rel="noopener noreferrer"`.
- [ ] Auth-gated by `(platform)` layout.
- [ ] Navbar "Leagues" link points here.
- [ ] `(platform)/app/leagues/` mock deleted (per audit A1).
- [ ] `(shared)/leagues/page.tsx` deleted (per audit A2).
- [ ] Visual warmth pass applied (matches Clubs surface tone).
- [ ] `npm run build` clean.

### Research Insights

**Build-error trap when deleting `(shared)/leagues/`:**

Both `(shared)/leagues/page.tsx` (current) and `(platform)/leagues/page.tsx` (new) resolve to `/leagues`. Next.js will throw at build time if both exist simultaneously. **Sequencing requirement:** delete `(shared)/leagues/` AND create `(platform)/leagues/` in the SAME commit. Don't try to ship the new page first and the deletion later — build won't compile in between.

**Verify pre-deletion:** `grep -rn '/app/clubs\|/app/leagues' src/` — confirm no nav link still points to the old `(platform)/app/*` mocks before Track 6 deletes them.

**Lift `STARLIVE_LEAGUE_LINKS` to env vars** if URLs differ across staging/prod. `lib/constants.ts` is correct only when URLs are guaranteed identical across environments. Use `process.env.NEXT_PUBLIC_STARLIVE_LEAGUE_URL_1` etc.

**Approval-gate consideration:** the existing approval gate gates `/dashboard`, `/admin`, `/platform` — but NOT `/messages` or `/leagues`. If unapproved scouts shouldn't see Leagues either, add `/leagues` to the role-scoped path list in middleware. Otherwise an unapproved scout reaching `/leagues` is intended (chat is the product, leagues is link-out — neither requires approval). Decide and document.

**Anti-pattern:** any "Coming soon" empty state should not block the page render. Always render the three cards, even with placeholder URLs — the page works the day Andria provides URLs by editing one constant.

---

# Track 4 — Academy Admin Club Customization Editor

## Overview

Give academy admins a settings page where they edit the four customization fields that drive their club's scout-facing detail page: logo, hero photo, history text, photo gallery. Powered by Track 1's schema.

## Reality vs Brief

- ✅ `/admin/` route exists with admin sidebar.
- ✅ `getAdminContext()` exists in `lib/auth.ts`.
- ✅ `PlayerForm.tsx` exists as a reference pattern.
- ❌ No "edit my club" route or component yet.
- ❌ No file upload helper for `club-assets` storage bucket.

## Route

```
src/app/admin/club/edit/page.tsx
```

Server component:
1. Calls `getAdminContext()` → `{ user, profile, club }` or redirect.
2. Renders `<ClubProfileForm initialClub={club} />` (client component).

Update `AdminSidebar.tsx`: add "Club" link between "Players" and "Messages".

## Form component: `ClubProfileForm.tsx`

Client component, modeled on `PlayerForm.tsx`. Sections:

### 1. Basic Info (read-only header)

Display: club name, slug, city, region, founded year. Not editable in v1.

### 2. Logo

- Current logo preview (32×32).
- "Change logo" → file picker → upload to `club-assets/<slug>/logo.<ext>` → stage URL.
- Save → `clubs.logo_url` updates.
- Constraints: square recommended, ≥256px, jpg/png/webp, ≤2MB. Client validation.

### 3. Hero photo

- Current hero preview (full width, ~16:9).
- "Change hero" → file picker → upload to `club-assets/<slug>/hero.<ext>` → stage URL.
- Save → `clubs.hero_photo_url` updates.
- Constraints: ≥1600×900 recommended, jpg/png/webp, ≤5MB.

### 4. History text

- `<textarea>` 8 rows, character count "0 / 4000" beneath.
- Help text: "Tell scouts about your club's history, philosophy, and what makes you distinct."

### 5. Photo gallery

- Grid of current `gallery_urls` (≤12). Each tile: thumbnail, delete on hover, drag handle for reorder (`@dnd-kit/core`).
- "Add photos" button → file picker, multi-select.
- Each new file uploads to `club-assets/<slug>/gallery/<uuid>.<ext>` → URL appended to `gallery_urls`.
- Save → `clubs.gallery_urls` updates with current ordered list.
- Constraints: ≤12 total, jpg/png/webp, ≤5MB each.

### 6. Submit

- "Save changes" (primary), "Discard" (secondary).
- Toast on success/failure.
- Disabled state during save.

## Server action: `updateMyClub`

`src/app/actions/admin-club.ts`:

```ts
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminContext } from '@/lib/auth'

const ClubProfileSchema = z.object({
  logo_url: z.string().url().optional(),
  hero_photo_url: z.string().url().nullable().optional(),
  history_text: z.string().max(4000).nullable().optional(),
  gallery_urls: z.array(z.string().url()).max(12).optional(),
})

export async function updateMyClub(input: unknown) {
  const parsed = ClubProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input', issues: parsed.error.flatten() }
  }

  const { profile, club } = await getAdminContext()
  if (!club) return { ok: false, error: 'No club associated with your account.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('clubs')
    .update(parsed.data)
    .eq('id', club.id)
  if (error) {
    console.error('updateMyClub failed:', error.message)
    return { ok: false, error: 'Save failed.' }
  }

  revalidatePath('/admin/club/edit')
  revalidatePath(`/clubs/${club.slug}`)
  return { ok: true }
}
```

NOT included in the action: `tier`, `name`, `slug`, `city`, `region`, `description`. Tier is platform-admin-only (RLS trigger blocks anyway). Identity fields out of scope for v1.

## File upload helper

`src/lib/storage.ts`:

```ts
import { createClient } from '@/lib/supabase/client'

export async function uploadClubAsset(
  file: File,
  clubSlug: string,
  kind: 'logo' | 'hero' | 'gallery'
): Promise<{ url: string } | { error: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = kind === 'gallery'
    ? `${clubSlug}/gallery/${crypto.randomUUID()}.${ext}`
    : `${clubSlug}/${kind}.${ext}`

  const { error } = await supabase.storage
    .from('club-assets')
    .upload(path, file, { upsert: kind !== 'gallery', contentType: file.type })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from('club-assets').getPublicUrl(path)
  return { url: data.publicUrl }
}
```

## System-wide impact

- **Interaction graph:** Save → server action → `clubs` UPDATE → trigger checks tier (no change, passes) → `revalidatePath('/clubs/<slug>')`.
- **Error propagation:** validation/upload/DB write failures all surface as toasts; form keeps user input.
- **State lifecycle risks:** orphan storage objects when user closes tab before save. Tracked in `Haveinmind.md`.
- **Security:** RLS + storage policies (Track 1). `getAdminContext()` defense in depth.

### Integration test scenarios

1. Academy admin opens `/admin/club/edit` → form renders with current values.
2. Uploads new logo → preview updates → Save → DB updates → `/clubs/<slug>` shows new logo.
3. 11MB file → client-side rejected.
4. Wrong type (.pdf as logo) → client-side rejected.
5. Gallery reorder → Save → DB array order matches.
6. 5000-char history → counter goes red, Save disabled.
7. 4000 chars → success.
8. Other admin opens `/admin/club/edit` → sees their own club.
9. URL param tampering `?id=<other-club>` → ignored (server uses session club).
10. Scout hits `/admin/club/edit` → 404 via admin layout gate.

## Track 4 acceptance criteria

- [x] `src/app/admin/club/edit/page.tsx` (server component) wired with `getAdminContext()`.
- [x] `src/components/admin/ClubProfileForm.tsx` client component.
- [x] `src/app/actions/admin-club.ts` server action with Zod validation.
- [x] `src/lib/storage.ts` upload helper.
- [x] AdminSidebar has "Club" link.
- [x] All five form sections work: logo, hero, history, gallery (add/delete/reorder), save.
- [x] All copy hardcoded English.
- [x] `npm run build` clean.
- [ ] Manual smoke (Torpedo academy_admin): edit all four fields → public `/clubs/torpedo-kutaisi` reflects them.

### Research Insights

**Form pattern — use `useActionState` + `useFormStatus` (React 19 / Next 16 idiom):**

Plan implies a manual `fetch`/`onClick` Save handler. The 2026 idiomatic shape is server-action-as-form-action:

```tsx
'use client'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateMyClub } from '@/app/actions/admin-club'

export function ClubProfileForm({ initialClub }: Props) {
  const [state, formAction] = useActionState(updateMyClub, null)
  // Image URLs live in useState as staged client refs — submit via hidden inputs

  return (
    <form action={formAction}>
      {/* ... fields ... */}
      <input type="hidden" name="gallery_urls" value={JSON.stringify(galleryUrls)} />
      {state && !state.ok && <p className="text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
}
```

**Direct browser → Supabase Storage. NEVER route file bytes through server actions** — Next.js form actions have a 4MB body limit by default, hero photos blow that. Browser uploads via supabase-js client, then submit only the URLs to the action.

**Security findings on uploads (HIGH severity — fix before shipping):**

F5 — server-side magic-byte validation. Client-only is bypassable. Use the `file-type` package server-side, re-validate before accepting URL into the DB. F6 — extension allowlist:

```ts
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const ext = (file.name.split('.').pop() ?? '').toLowerCase()
if (!ALLOWED_EXT.has(ext)) return { ok: false, error: `Unsupported: .${ext}` }
```

**Always derive `clubSlug` from `getAdminContext()` server-side. Never accept it from the caller.** Otherwise a buggy/malicious caller can write to other clubs' folders.

**Server action — Zod schema with URL whitelist (defense in depth):**

```ts
const clubAssetUrl = z.string().url().refine(
  (u) => u.includes('/storage/v1/object/public/club-assets/'),
  'Must be a club-assets storage URL'
)

const ClubProfileSchema = z.object({
  logo_url: clubAssetUrl.nullable().optional(),
  hero_photo_url: clubAssetUrl.nullable().optional(),
  history_text: z.string().max(4000).nullable().optional()
    .transform((v) => (v?.trim() ? v : null)),
  gallery_urls: z.array(clubAssetUrl).max(12).optional(),
}) satisfies z.ZodType<Partial<Database['public']['Tables']['clubs']['Update']>>
```

The `satisfies` clause catches drift between Zod and the DB row's update shape at compile time. **Standardize this pattern across all server actions.**

**Use `Result<T, E>` discriminated union** in `src/lib/result.ts`:

```ts
export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E; issues?: Record<string, string[]> }
```

Replace the plan's `{ ok, error?, issues? }` and the upload helper's `{ url } | { error }` "secret discriminated union" — both narrow structurally but lack a `tag`, awkward.

**Cache-busting on logo/hero `upsert`:**

`upsert: kind !== 'gallery'` overwrites the previous file at the same path → URL never changes → browsers cache the old image. Either:
- Append `?v=${Date.now()}` to the public URL after upload, or
- Include a hash in the path (different path each time, then delete the old).

Add to `Haveinmind.md`: "Phase 7 storage: extension-rotation orphan cleanup."

**`@dnd-kit/core` for reorder OR up/down arrows (YAGNI alternative for v1):**

If keeping drag — use `@dnd-kit/core` + `@dnd-kit/sortable`, URL of each photo as the dnd-kit `id` (UUIDs guarantee uniqueness):

```tsx
function handleDragEnd({active, over}: DragEndEvent) {
  if (!over || active.id === over.id) return
  setItems(arr => arrayMove(arr, arr.indexOf(String(active.id)), arr.indexOf(String(over.id))))
}
```

Keyboard accessible by default (a11y win). For touch devices, dnd-kit handles correctly.

**v1-cheap alternative:** ↑/↓ arrow buttons on each tile (~10 LOC). For ≤12 photos, re-uploading is acceptable. Skips the npm dep entirely. Defer drag to v1.5 if academy admins ask.

**`useOptimistic` for reorders** is overkill — local state + "Uploading…" placeholder card with temp ID is simpler. `useOptimistic` shines for server roundtrips you want to mask; image upload is already snappy.

**Storage signed URL handling** — from `docs/solutions/integration-issues/supabase-storage-signed-url-expiry-chat.md`:

Supabase Storage signed URLs expire (7 days default). If `gallery_urls` stores public URLs of a `public: true` bucket, no expiry — fine. If you ever switch to `public: false` + signed URLs, **store the file PATH** (`<slug>/gallery/<uuid>.jpg`) and generate signed URLs at render time. Don't store expiring URLs as permanent data.

**`crypto.randomUUID() satisfies UUID`** — overkill for v1. Branded UUIDs are "would be nice" only when UUIDs get confused with other strings. Pass.

**Anti-patterns:**

- Hand-rolled DTO types that duplicate generated DB types — drift the moment a column changes. Use `Pick<Database['public']['Tables']['clubs']['Row'], …>`.
- "Secret" discriminated unions like `{ url } | { error }` — add `ok: true | false`.
- `as` casts to escape Supabase's `unknown`/`null` returns — handle `error` and `null` cases first, then narrow.
- Untyped `createClient()` calls — every Supabase factory returns `SupabaseClient<Database>`. Verify in `lib/supabase/server.ts`.
- Storing filter state in two places (URL + `useState`) — pick one.

**Add `error.tsx`** at `app/admin/club/edit/error.tsx` — currently missing from acceptance.

**Sources:**
- [Next.js Server Actions: Complete Guide (2026)](https://makerkit.dev/blog/tutorials/nextjs-server-actions)
- [React Hook Form + DnD Kit reference](https://stackblitz.com/edit/react-hook-form-dnd-kit)
- [useSortable Hook — dnd kit](https://dndkit.com/react/hooks/use-sortable/)
- `docs/solutions/integration-issues/supabase-storage-signed-url-expiry-chat.md`

---

# Track 5 — Chat Redesign (Visual + UX Pass)

## Overview

Visual redesign of the existing chat surface. **Functionality preserved** — real-time messages, file attachments, player references, block/unblock all stay. Work is layout, type, color, motion, and a re-evaluation of `PlayerRefCard` now that scout-facing player profiles no longer exist.

## Reality vs Brief

- ✅ Chat is fully functional with real-time, uploads, anti-spam.
- ✅ Components: `ChatInbox, ChatThread, ChatSidebar, ChatMessagesLayout, ChatInput, ChatEmptyState, MessageBubble, DateDivider, MobileChatDrawer, PlayerRefCard, PlayerSearchModal, MessageAcademyButton`.
- ⚠️ Chat scout route is `/dashboard/messages` — must move to `/messages` (audit A3).
- ⚠️ `PlayerRefCard` links to `/players/[slug]` — must change.
- ⚠️ Heavy `t()` use — strip in this track.
- ⚠️ Hospital-vibes — apply warmth.
- ❓ No design direction yet — Phase A produces it for Andria sign-off.

## Phase A — Audit + design direction (BEFORE code)

Read every chat file. Map current visual state. Capture: information density, color usage, typography, spacing rhythm, empty/loading states, mobile drawer behavior.

Produce 2–3 whole-page mockups (per `feedback_visual_companion_whole_page.md`):
- **Variant A — "warm editorial":** generous spacing, serif headlines, off-white surface, subtle paper texture, primary green only on accents.
- **Variant B — "compact pro":** dense list, smaller type, primary on active states, Slack/Linear feel.
- **Variant C — Andria's tweak.**

Andria picks before code starts.

## Phase B — Implementation (after design lock)

### 1. Move route

- Create `src/app/(platform)/messages/{page.tsx, layout.tsx, [conversationId]/page.tsx}` mirroring current structure.
- Delete `src/app/dashboard/messages/` (part of dashboard kill in Track 6 — sequencing matters).
- Update internal links: `MessageAcademyButton`, `Navbar`, etc.
- Server actions and APIs don't move.

### 2. Strip `t()` calls

Every chat component file: replace `t('chat.foo')` with hardcoded English. Drop `useLang()` / `getServerT()` imports.

### 3. PlayerRefCard rework

**Decision:** card is non-clickable. Renders player name, club, age, position, photo. Subtle "from <club name>" footer that links to `/clubs/[club-slug]`. PlayerSearchModal still works for academy admins.

### 4. Visual redesign per chosen variant

- ChatInbox sidebar: drop divider lines, use spacing for separation, subtle hover bg.
- ChatThread: serif name, larger date dividers, message bubbles less "chat app" / more "email-like" generosity.
- ChatInput: chunkier, more affordance for attach + player ref.
- DateDivider: small caps "Tuesday, April 22" rather than rule-with-date-in-middle.
- MessageBubble: own-side and other-side use surface vs elevated tokens (not green vs gray — clinical).
- File attachments: image previews larger; doc attachments labeled cards with file icon.
- ChatEmptyState: editorial copy ("Start a conversation with a Georgian academy") — no generic "No messages yet."
- MobileChatDrawer: animate in with motion, not hard cut.

### 5. Scroll system

`MEMORY.md` notes a brittle scroll system in `ChatThread.tsx`. **Don't refactor unless redesign requires it.** Preserve `flushSync`, `wasAddedRef`, rAF-throttled handler.

### 6. Block/unblock UX polish

Confirmation modal copy, consistent button styling.

### 7. Notifications integration

NotificationBell continues to badge unread. Confirm `/messages` nav link badge still polls (`get_total_unread_count` RPC).

## System-wide impact

- **Interaction graph:** send → POST `/api/messages` → DB → Realtime broadcast → recipient updates → unread RPC → NotificationBell. Already wired; don't break.
- **Error propagation:** send fail → toast + retry; upload fail → progress reset; realtime drop → reconnect.
- **State lifecycle risks:** same as today.
- **API surface parity:** no API changes.

### Integration test scenarios

1. Open thread, send text → message appears, recipient receives via realtime.
2. Send image → preview inline, recipient sees full.
3. Send player ref → recipient sees non-clickable card with "from <club>" footer.
4. Click "from <club>" footer → lands on `/clubs/[slug]`.
5. Block scout → next send rejected at API.
6. Mobile: open inbox → tap conversation → drawer animates in → swipe back → drawer animates out.
7. Empty inbox → editorial empty state.
8. Direct URL `/dashboard/messages` → 404 (or redirect to `/messages`).

## Track 5 acceptance criteria

### Phase A

- [ ] Audit doc with current-state screenshots saved (locally, not committed unless Andria asks).
- [ ] 2–3 whole-page mockups produced (HTML/CSS, real tokens, embedded variant nav).
- [ ] Andria signs off on a variant.

### Phase B

- [ ] Chat moved from `/dashboard/messages` to `/messages` under `(platform)`.
- [ ] All chat internal links updated.
- [ ] PlayerRefCard renders non-clickable, with "from <club>" link to club page.
- [ ] All `t()` calls in `src/components/chat/` replaced with hardcoded English.
- [ ] Visual variant from Phase A applied.
- [ ] MobileChatDrawer animates.
- [ ] Block/unblock copy polished.
- [ ] Manual smoke: send text, image, doc, player ref — all behave correctly.
- [ ] `npm run build` clean.

### Research Insights

**Route-move ordering is wrong in plan (will break build between commits):**

Plan's Phase B order is "1. Move route, 2. Strip t(), 3. PlayerRefCard rework". Step 1 deletes `/dashboard/messages` while internal links still point at it → build breaks. **Correct order:**

1. Create `(platform)/messages/{page,layout,[conversationId]/page}.tsx` mirroring current — both routes alive.
2. Update internal links: `MessageAcademyButton`, `Navbar`, `useAuth()`-driven sidebar, NotificationBell, AvatarDropdown.
3. Replace `/dashboard/messages/page.tsx` with a one-line `redirect('/messages')` (308 permanent) — bookmarked URLs survive one deploy cycle.
4. Strip `t()` calls in `src/components/chat/*` AND `src/lib/chat-utils.ts`.
5. Strip `import type { Lang } from '@/lib/translations'` in chat files (see audit insight).
6. PlayerRefCard rework.
7. Visual variant from Phase A.
8. Delete the redirect file (in Track 6's dashboard kill).

**Strip `Lang` type imports from chat NOW (not Track 7):** `chat-utils.ts`, `PlayerRefCard.tsx`, `PlayerSearchModal.tsx`, `MessageBubble.tsx` all import `type { Lang } from '@/lib/translations'`. If left until Track 7's directory deletion, build breaks. Add to acceptance: "no imports from `@/lib/translations` (including `type Lang`) remain in chat files."

**PlayerRefCard rework — variant component:**

```tsx
type PlayerRef = {
  id: string
  fullName: string
  position: string | null
  age: number | null      // computed at send-time, not raw DOB
  photoUrl: string | null
  jerseyNumber: number | null
  club: { slug: string; name: string } | null
}

export function PlayerRefCard({ player }: { player: PlayerRef }) {
  return (
    <div className="...non-clickable card body...">
      {/* photo + name + meta */}
      {player.club ? (
        <Link href={`/clubs/${player.club.slug}`} className="...">
          from {player.club.name}
        </Link>
      ) : (
        <span className="...">free agent</span>
      )}
    </div>
  )
}
```

**Snapshot player-ref data into `messages.metadata` JSONB at SEND time, not live fetch.** Reasons:
- Insulates from RLS changes (if future scope tightens `players` SELECT).
- Insulates from player updates (transfers, photo changes) — message stays consistent with what was sent.
- Deletion-safe (player deleted? message still renders).
- Click-through to `/clubs/[slug]` uses live data — best of both.

**Backfill script** for existing chat messages with player refs: server-side action that JOINs `players → clubs` and writes the snapshot into each `messages.metadata`. One-time migration alongside Track 5.

**Security finding F13 (MEDIUM) — projection lock-down:**

`PlayerRefCard` snapshot must whitelist columns. **NEVER** include `parent_guardian_contact`, raw `date_of_birth` (use computed `age`), home address, medical fields. Define `getPlayerRefData(playerId)` server function with typed return that excludes sensitive columns. Add a `player_ref_public` VIEW for defense in depth.

**Verify `/api/players/search` projection** — used by `PlayerSearchModal` (kept). Search results must project only safe fields. If currently `select('*')`, tighten before Track 6.

**Realtime architecture (2026 best practices):**

- **Broadcast** (pub/sub, <100ms) for messages — already in place via Supabase Realtime channels.
- **Presence** for typing indicators — auto-cleared on disconnect, no `typing_users` table needed. `channel.track({typing: true})`, throttle to once per 3s, clear on send.
- **Postgres Changes** as fallback/audit only — higher latency.
- Server-assigned `created_at` is canonical for ordering. Optimistic message gets a `client_id`; reconcile by replacing on broadcast arrival.
- Soft-delete (`deleted_at`) for delete UX — broadcast carries an "edit" event so existing clients grey out; hard delete leaves orphaned UI.
- `useOptimistic` (React 19) for sends — masks the round trip.

**Mobile `100dvh` not `100vh`** on chat thread containers — from `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`. Mobile browsers' address bar makes `100vh` overflow.

**Preserve scroll system carefully.** `MEMORY.md` flags `ChatThread.tsx` as brittle: `flushSync` + `wasAddedRef` + rAF-throttled handler + `scrollToBottomRef`. If redesign changes the thread DOM structure (e.g. wraps messages in a different scroll container), `scrollToBottomRef` and dedup will silently break. Test: send 3 messages in <1s and verify only one scroll-to-bottom fires. Test on iOS Safari — that's where the original `scrollIntoView` bug lived.

**Realtime channel naming** — verify nothing path-derives a channel name. `grep "channel(" src/components/chat/`. Channels keyed on conversation ID survive route moves.

**RLS for chat profile names** — from `docs/solutions/database-issues/chat-system-rls-profile-rls.md`: scout names displayed as "Unknown" when academy_admins viewed threads. Audit `profiles` RLS allows the cross-role SELECT before deleting `/players/[slug]`. Confirm chat can still JOIN profiles for names without permission errors. If player references are removed, ensure fallback `display_name_cached` in messages is populated.

**Phase A skip (per code-simplicity):** mockup-then-implement is a team-handoff process. Solo dev with hot reload + Playwright iterates faster on real code. Pick a direction in 30min of thinking, build it on a branch, iterate visually. Saves 4–6 hours.

**Sources:**
- [Realtime | Supabase Docs](https://supabase.com/docs/guides/realtime)
- [Realtime Chat — Supabase UI](https://supabase.com/ui/docs/nextjs/realtime-chat)
- [Realtime Presence](https://supabase.com/features/realtime-presence)
- `docs/solutions/ui-bugs/chat-system-polish-i18n-mobile-realtime.md`
- `docs/solutions/database-issues/chat-system-rls-policy-and-displayname-fixes.md`
- `docs/solutions/integration-issues/supabase-storage-signed-url-expiry-chat.md`

---

# Track 6 — Demolition (Kill Scout-Facing Discovery Surface)

## Overview

Delete the scout-facing player directory, dashboard, matches, watchlist, AI search, and related components. Big destructive sweep. Runs **after** new Clubs + Leagues surfaces work and chat has moved.

## Reality vs Brief

Recon revealed a larger demolition surface than `MEMORY.md` suggested:

- Player surface: `(platform)/app/players/`, `components/player/*` (15 files), `/api/players/*`.
- Dashboard surface: `dashboard/` (page, layout, error, messages), `components/dashboard/*` (10 files including watchlist UI).
- Matches: `(platform)/app/{schedule,standings}/`, `components/match/*` (5 files), `/api/matches/*`.
- Watchlist: actions in `app/actions/{watchlist,watchlist-folders,watchlist-tags}.ts`, `components/dashboard/Watchlist*`, `components/player/WatchButton.tsx`.
- AI search: `lib/ai-search/{prompt,service,types}.ts`, `AISearchBar`, `AIFilterTags`.
- Camera (audit B7 default = delete): `(platform)/camera/` (platform admin), `/api/camera/`, `/api/pixellot/`, `lib/camera/*`, `components/platform/{ClubMappingForm,PlayerMappingForm,SyncLogTable,SyncTrigger}.tsx`.
- Contact requests: `/api/contact-requests/`, `app/actions/contact.ts`, `components/forms/ContactRequestForm.tsx`, `components/dashboard/RequestsList.tsx`.
- Filters: `components/forms/{FilterPanel,FilterPopover}.tsx`.
- Player view tracking + admin cards: `app/actions/player-views.ts` (if exists), `components/admin/{DashboardPlayerViews,DashboardScoutActivity,ScoutDemandCard,DashboardStatCards,DashboardQuickActions}.tsx` (per audit B5).

## Phase A — Reference audit

For each candidate file:

```bash
grep -rn '<filename or symbol>' src/ --include='*.ts' --include='*.tsx'
```

Categorize:
- (a) Only imported by other deletion candidates → safe to delete together.
- (b) Imported by code we're keeping → rewrite import or keep file.
- (c) Imported by tests → delete tests too.

## Phase B — Routes

```
DELETE: src/app/(platform)/app/                          (entire subtree)
DELETE: src/app/dashboard/                               (entire subtree, after chat move)
DELETE: src/app/(shared)/leagues/                        (per audit A2)
```

## Phase C — Components

```
DELETE: src/components/player/                           (15 files)
DELETE: src/components/match/                            (5 files)
DELETE: src/components/dashboard/                        (10 files)
DELETE: src/components/forms/{FilterPanel,FilterPopover,ContactRequestForm}.tsx
DELETE: src/components/admin/{DashboardPlayerViews,DashboardScoutActivity,ScoutDemandCard}.tsx (per audit B5)
DELETE: src/components/ui/LanguageToggle.tsx             (overlap with Track 7)
DELETE: src/components/platform/{ClubMappingForm,PlayerMappingForm,SyncLogTable,SyncTrigger}.tsx (per audit B7)
```

KEEP: `PlayerSearchModal.tsx`, `PlayerRefCard.tsx` — used by chat for academy-admin player attachments.

## Phase D — Lib + actions

```
DELETE: src/lib/ai-search/                               (3 files)
DELETE: src/lib/camera/                                  (5 files)
DELETE: src/app/actions/{contact,watchlist,watchlist-folders,watchlist-tags}.ts
DELETE: src/app/actions/player-views.ts                  (if exists, per audit B5)
DELETE: src/app/actions/platform-players.ts              (if redundant; verify)
```

KEEP: `app/actions/{admin-players,admin-transfers,platform-transfers,platform-clubs}.ts`.

## Phase E — APIs

```
DELETE: src/app/api/players/                             (search, [id], [id]/pdf, route.ts)
DELETE: src/app/api/admin/players/                       (only if redundant; check)
DELETE: src/app/api/contact-requests/
DELETE: src/app/api/matches/
DELETE: src/app/api/camera/
DELETE: src/app/api/pixellot/
```

KEEP: `/api/conversations/*`, `/api/messages/*`, `/api/chat-upload/`, `/api/transfers/*`, `/api/clubs/*`, `/api/notifications/`.

## Phase F — Hooks

DELETE NOTHING under `src/hooks/` here. Track 7 handles `useLang.ts`.

## Phase G — DB cleanup migration

`20250101000051_redesign_cleanup.sql`:

```sql
DROP TABLE IF EXISTS player_views CASCADE;
DROP TABLE IF EXISTS watchlist_items CASCADE;       -- verify exact name
DROP TABLE IF EXISTS watchlist_folders CASCADE;     -- verify exact name
DROP TABLE IF EXISTS watchlist_tags CASCADE;        -- verify exact name
DROP FUNCTION IF EXISTS calculate_scout_demand;     -- verify name
```

KEEP: `contact_requests` (historical), `academy_announcements` (audit B3), `notifications` (audit B2), `players` (still backs club rosters).

## Phase H — Config + middleware

- `middleware.ts`: kill `/players` redirect (audit C1).
- `next.config.ts`: drop Pixellot env-var validation if any.
- `.env.local` / Vercel: leave PIXELLOT_* vars (no harm; remove in v2 prep).

## Phase I — Navbar updates

- Final scout link set: **Clubs · Leagues · Messages**.
- Admins keep AdminSidebar links.
- Remove `LanguageToggle` import.

## Phase J — Build + smoke

After every phase:

```bash
npm run build
```

Fix every TS/import error before next phase. Final smoke:
1. Login as scout → land on `/`.
2. Click Clubs → directory loads.
3. Click into a club → detail page works.
4. Click Message Academy → opens thread.
5. Click Leagues → three buttons render.
6. Click a league → opens Starlive in new tab.
7. URL `/players` → 404.
8. URL `/dashboard` → 404 (or redirect to `/`).
9. URL `/matches` → 404.

## Atomicity

Big destructive change. Two options:
- (a) **One mega-PR** — easier consistency, harder review, riskier.
- (b) **Phased PRs** — Phase B+I (routes + nav), then C (components), then D+E (lib + api), then G (DB). Each builds clean. **Recommended.**

## Track 6 acceptance criteria

- [ ] Phase A reference audit produced (markdown checklist).
- [ ] Phases B–F completed; `npm run build` clean after each.
- [ ] Phase G migration applied to remote.
- [ ] Phase H middleware fix applied.
- [ ] Phase I navbar updated.
- [ ] Phase J 9-scenario smoke passes.
- [ ] No `_archive/` folder created — git history is the archive.
- [ ] Pixellot env vars left in Vercel (remove in v2 prep).

### Research Insights

**Wrong watchlist table names in plan (HIGH — migration will partially miss):**

Plan drops `watchlist_items` (does NOT exist). Actual tables per `20250101000036_create_watchlist_system.sql`:

```sql
DROP TABLE IF EXISTS watchlist_tags CASCADE;
DROP TABLE IF EXISTS watchlist_folder_players CASCADE;
DROP TABLE IF EXISTS watchlist_folders CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS player_views CASCADE;
```

**RPCs survive `CASCADE` and crash at next call (HIGH):**

`CASCADE` drops only structural dependents (FKs, views). RPCs reference table names in their SQL bodies as **late-binding** — they survive the CASCADE and fail at first call with `relation "player_views" does not exist`. The three demand RPCs from `..039`:

```sql
DROP FUNCTION IF EXISTS public.get_scout_demand_by_country(uuid);
DROP FUNCTION IF EXISTS public.get_player_scout_demand(uuid);
DROP FUNCTION IF EXISTS public.get_scout_demand_last_month(uuid);
DROP FUNCTION IF EXISTS public.get_player_view_counts(uuid[]);
DROP FUNCTION IF EXISTS public.get_player_view_counts();
DROP TABLE IF EXISTS player_views CASCADE;
```

(Plan said `calculate_scout_demand` — that name does NOT exist. Verify with `pg_proc` query.)

**DO NOT delete `/api/players/search`:**

Chat's `PlayerSearchModal` (kept, used by academy admins) hits this route. Either keep it gated to `role='academy_admin'`, or rename to `/api/admin/players/search`. Plan currently lists it for unconditional deletion — **blocker**.

**Drop `contact_requests` write policies (security finding F9 — LOW but real):**

Plan keeps `contact_requests` table for historical data. The scout INSERT policy stays active. A scout reverse-engineering the deleted endpoint (or any new code path) could insert spam rows. Migration:

```sql
DROP POLICY IF EXISTS "Scouts can insert contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Club admins can update contact requests" ON contact_requests;
-- Keep SELECT for platform_admin only
```

**Pre-flight FK + policy audit:**

```sql
-- FKs pointing IN to dropped tables
SELECT conname, conrelid::regclass AS from_table, confrelid::regclass AS to_table
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid::regclass::text IN
      ('player_views','watchlist','watchlist_folders','watchlist_folder_players','watchlist_tags');

-- RLS policies referencing dropped tables in JOINs (CASCADE doesn't follow these)
SELECT polname, polrelid::regclass
FROM pg_policy
WHERE pg_get_expr(polqual, polrelid) ILIKE '%player_views%'
   OR pg_get_expr(polqual, polrelid) ILIKE '%watchlist%';

-- RPC bodies referencing them
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND (prosrc ILIKE '%player_views%' OR prosrc ILIKE '%watchlist%');
```

**Realtime publication cleanup:**

If `player_views` was ever added to `supabase_realtime` publication, drop it BEFORE `DROP TABLE` — `ALTER PUBLICATION supabase_realtime DROP TABLE player_views;`. Same for `watchlist*`.

**PostgREST schema reload at end of migration:**

```sql
NOTIFY pgrst, 'reload schema';
```

Otherwise PostgREST caches the old schema for ~10 minutes and your API can return 400s on dropped tables / 200s with old shapes.

**Backup before destructive drops (data-integrity-guardian recommendation):**

```sql
-- Run manually before applying:
-- COPY (SELECT * FROM player_views)             TO '/tmp/player_views_backup.csv'  CSV HEADER;
-- COPY (SELECT * FROM watchlist)                TO '/tmp/watchlist_backup.csv'     CSV HEADER;
-- COPY (SELECT * FROM watchlist_folders)        TO '/tmp/wl_folders_backup.csv'    CSV HEADER;
-- COPY (SELECT * FROM watchlist_folder_players) TO '/tmp/wl_folder_p_backup.csv'   CSV HEADER;
-- COPY (SELECT * FROM watchlist_tags)           TO '/tmp/watchlist_tags_backup.csv' CSV HEADER;
```

Or `pg_dump --data-only --table=...`. Add Haveinmind entry: "Phase 7 demolition: confirm CSV exports archived before applying 051."

**Atomicity (recommended):** Phased PRs, not one mega-PR. Phase B+I (routes + nav), then C (components), then D+E (lib + api), then G (DB after one full deploy cycle of healthy code on ..F). Reduces blast radius.

**Two-phase deprecation pattern (overkill for solo dev but worth knowing):**

Migration N: `REVOKE ALL ON player_views FROM authenticated, anon; ALTER TABLE player_views DISABLE TRIGGER ALL;` — table exists but nothing reads/writes. Run for one deploy cycle. Migration N+1: `DROP TABLE`. Surface a forgotten import as permission error instead of silent data loss to phantom table.

**Bundle delta target — capture baseline NOW:**

Before Track 6 starts:

```bash
ANALYZE=true npm run build
cp -r .next/diagnostics/analyze /tmp/before-track-6/
```

After Track 6 lands:

```bash
ANALYZE=true npm run build
cp -r .next/diagnostics/analyze /tmp/after-track-6/
diff /tmp/before-track-6/ /tmp/after-track-6/
```

**Estimated win:** ~150–200KB gzipped removed from scout-facing JS. Lighthouse perf ~85→95+ on `/clubs`. Plus 4 route bundles (player profile, player directory, comparison, dashboard) eliminated.

Add `hashicorp/nextjs-bundle-analysis@v1` GitHub Action for per-PR diffs.

**Foreign key health** — surviving FKs to `players` after Track 6 (verified clean): `notifications.player_id`, `player_club_history.player_id`, `match_player_stats.player_id`, `transfer_requests.player_id`. `players` table itself stays. No orphan risk.

**Storage object orphans:** if any old player-photo bucket exists, dropping `player_views` doesn't drop the bucket. Track 6 doesn't address — flag in Haveinmind if applicable.

**Sources:**
- `supabase/migrations/20250101000023_create_player_views.sql` — actual `player_views` schema
- `supabase/migrations/20250101000036_create_watchlist_system.sql` — actual watchlist table names
- `supabase/migrations/20250101000039_add_country_to_profiles_and_demand_rpcs.sql` — three RPCs reading `player_views`
- [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) · [HashiCorp nextjs-bundle-analysis](https://github.com/hashicorp/nextjs-bundle-analysis)

---

# Track 7 — i18n Machinery Removal

## Overview

Strip every `t()` call site, delete `LanguageContext`, `useLang`, `getServerT`, the translations files, the language toggle, the language cookie machinery, and drop bilingual DB columns. Site is English-only; the dual-translation infrastructure has no purpose.

## Reality vs Brief

- ✅ Decision firm: English-only (2026-04-15).
- ⚠️ Recon: **132 `t('` call sites + 129 `useLang/getServerT` references**.
- ⚠️ 6 translation files: `src/lib/translations/{admin,chat,core,index,landing,players}.ts`.
- ⚠️ DB has `_ka` columns: `clubs.name_ka`, `clubs.description_ka`, `players.*_ka`, `leagues.*_ka`, `academy_announcements.*_ka`.

## Phase A — Sequence dependency

Wait for Track 6 (demolition) to land. Player components, match components, dashboard, AI search, watchlist, contact requests — all gone. Their `t()` calls go with them. Track 5 strips chat-folder `t()`. Track 2 strips clubs-folder `t()`. Remaining sites: probably 40–60.

## Phase B — Per-file English-replacement sweep

Per-domain batches:
- Batch 1: `(auth)/*` — login, register, pending, callback (~5 files).
- Batch 2: `(shared)/*` — about, contact, demo, privacy, terms (~5 files).
- Batch 3: `admin/*` and `components/admin/*` (~15 files).
- Batch 4: `platform/*` and `components/platform/*` (~15 files).
- Batch 5: `layout/*` — Navbar, Footer, AvatarDropdown, NotificationBell (~10 files).
- Batch 6: any remainder.

Process per file:
1. Open the file.
2. For every `t('foo.bar')`, look up EN string in `src/lib/translations/<domain>.ts`.
3. Replace with literal.
4. Drop `useLang()` / `getServerT()` import + `t` destructure.
5. Simplify if file becomes pure server component.

For non-literal `t(key)` (template strings, variables): write explicit mapping object.

## Phase C — Delete machinery

After Phase B: `grep -rn "useLang\|getServerT\|t('" src/ | wc -l` = 0.

```
DELETE: src/hooks/useLang.ts
DELETE: src/lib/server-translations.ts
DELETE: src/lib/translations/                            (entire dir)
DELETE: src/context/LanguageContext.tsx
DELETE: src/components/ui/LanguageToggle.tsx             (already in Track 6, idempotent)
```

Edits:
- `src/app/layout.tsx`: remove `<LanguageProvider>` wrapper.
- `src/middleware.ts`: drop `lang` cookie handling (if any).
- `next.config.ts`: drop Noto Sans Georgian font if loaded.
- `package.json`: drop unused font subset dep if present.

## Phase D — DB cleanup migration

`20250101000052_drop_bilingual_columns.sql`:

```sql
-- Verify column list with: \d+ clubs / \d+ players / \d+ leagues / \d+ academy_announcements

ALTER TABLE clubs        DROP COLUMN IF EXISTS name_ka;
ALTER TABLE clubs        DROP COLUMN IF EXISTS description_ka;
ALTER TABLE players      DROP COLUMN IF EXISTS full_name_ka;        -- verify
ALTER TABLE players      DROP COLUMN IF EXISTS bio_ka;              -- verify
ALTER TABLE leagues      DROP COLUMN IF EXISTS name_ka;             -- verify
ALTER TABLE leagues      DROP COLUMN IF EXISTS description_ka;      -- verify
ALTER TABLE academy_announcements DROP COLUMN IF EXISTS title_ka;   -- verify
ALTER TABLE academy_announcements DROP COLUMN IF EXISTS body_ka;    -- verify
```

**Critical:** `grep -rn "_ka" src/` confirms zero references before applying. Then regenerate types.

## Phase E — Final verification

```bash
grep -rn "useLang"        src/ | wc -l   # → 0
grep -rn "getServerT"     src/ | wc -l   # → 0
grep -rn "LanguageProvider" src/ | wc -l # → 0
grep -rn "t('"            src/ | wc -l   # → 0 (review remaining)
grep -rn "_ka"            src/ | wc -l   # → 0

npm run build
npm run lint
```

## Risks & mitigations

- **Mis-replacement of dynamic `t(key)` calls:** explicit grep + manual review of every non-literal call.
- **Cookie residue on user browsers:** harmless, no code reads it.
- **Bundle weight cleanup:** drop Georgian font subset for measurable bundle savings.
- **`t` collisions** with other libraries' `t`: verify the import before replacing.

## Track 7 acceptance criteria

### Phase B (sweep)

- [ ] All 6 batches complete.
- [ ] Every `t()` replaced with literal or explicit mapping.
- [ ] All `useLang()` / `getServerT()` imports removed.

### Phase C (machinery delete)

- [ ] Files deleted (5 paths).
- [ ] Root layout no longer wraps `<LanguageProvider>`.
- [ ] Middleware no longer reads `lang` cookie.

### Phase D (DB)

- [ ] Migration `..52` written, reviewed, applied.
- [ ] `database.types.ts` regenerated; no `_ka` properties.

### Phase E (verify)

- [ ] All five greps return 0.
- [ ] `npm run build` clean.
- [ ] `npm run lint` clean.
- [ ] Manual smoke on every route — strings appear in English.

### Research Insights

**4 HIGH-severity blockers — fix before Phase D applies:**

**7.1 — Column-level GRANT in migration `..033` will be silently narrowed:**

Migration 33 (`20250101000033_protect_guardian_contact.sql`) issues `GRANT SELECT (id, club_id, name, name_ka, …, scouting_report_ka, …) ON players TO anon, authenticated`. `DROP COLUMN` auto-revokes the column-level grant for those names — BUT the surviving column-list grant doesn't auto-extend to new columns. **After dropping `_ka` columns, re-issue the GRANT explicitly:**

```sql
-- After all DROP COLUMNs:
GRANT SELECT (
  id, club_id, name, slug, date_of_birth, nationality, position, preferred_foot,
  height_cm, weight_kg, photo_url, jersey_number, scouting_report, status,
  is_featured, platform_id, created_at, updated_at
) ON public.players TO anon, authenticated;
```

**7.2 — `get_conversations_with_metadata` RPC will crash chat inbox:**

Migration `..030` defines the RPC with `cl.name_ka AS club_name_ka` in body and `club_name_ka text` in `RETURNS TABLE`. After dropping `clubs.name_ka`, the RPC fails at first call. **Fix: in migration `..052`, recreate the RPC WITHOUT `_ka` BEFORE `ALTER TABLE … DROP COLUMN`:**

```sql
DROP FUNCTION IF EXISTS public.get_conversations_with_metadata(uuid);
-- Then re-CREATE without club_name_ka in RETURNS TABLE and body
```

Include the full corrected function body in `..052` ahead of the column drops.

**7.3 — Wrong `_ka` column names in plan:**

Plan says `players.full_name_ka` and `players.bio_ka`. **Actual columns** per `20250101000002_create_players.sql`: `name_ka` and `scouting_report_ka`. Corrected drop:

```sql
ALTER TABLE clubs    DROP COLUMN IF EXISTS name_ka;
ALTER TABLE clubs    DROP COLUMN IF EXISTS description_ka;
ALTER TABLE players  DROP COLUMN IF EXISTS name_ka;
ALTER TABLE players  DROP COLUMN IF EXISTS scouting_report_ka;
ALTER TABLE leagues  DROP COLUMN IF EXISTS name_ka;
ALTER TABLE leagues  DROP COLUMN IF EXISTS description_ka;
ALTER TABLE academy_announcements DROP COLUMN IF EXISTS title_ka;
ALTER TABLE academy_announcements DROP COLUMN IF EXISTS body_ka;
-- matches.match_report_ka may already be gone (camera integration ..041 dropped it)
ALTER TABLE matches  DROP COLUMN IF EXISTS match_report_ka;
```

Verify exact list:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name LIKE '%_ka';
```

Don't ship `-- verify` comments to production. Paste the inventory into the migration directly.

**7.4 — Deploy-window race (HIGH):**

If migration applies before Vercel deploy completes, live frontend still selects `_ka` columns → PostgREST returns 400 → users see broken pages for 60–120s. **Required deploy order:**

1. Deploy code with all `_ka` reads removed (Track 7 Phase B).
2. Production runs fine because columns still exist; code just ignores them.
3. Apply migration `..052` to drop columns.
4. Regenerate types and commit.

Update plan acceptance to enforce this ordering.

**Pre-flight DO block — refuse migration if `_ka` references survive:**

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views    WHERE schemaname = 'public' AND definition ILIKE '%_ka%'
  ) THEN RAISE EXCEPTION 'Views still reference _ka columns'; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND definition ILIKE '%_ka%'
  ) THEN RAISE EXCEPTION 'Materialized views still reference _ka'; END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace AND prosrc ILIKE '%_ka%'
  ) THEN RAISE EXCEPTION 'Functions still reference _ka'; END IF;
END$$;
```

`DROP COLUMN` without `CASCADE` will error citing the dependent object — that error IS the safety net. **Don't use `CASCADE` on `_ka` drops.**

**Don't use `CASCADE` on `DROP COLUMN`.** Plain drop will error and tell you exactly what depends. CASCADE silently removes views/RPCs you'd want to know about.

**Sweep tooling — ts-morph custom transform (~60 LOC) over jscodeshift:**

```ts
// scripts/strip-i18n.ts
import { Project, SyntaxKind } from 'ts-morph'
import en from '../src/lib/translations/en.json'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
const sources = project.getSourceFiles('src/**/*.{ts,tsx}')

for (const sf of sources) {
  sf.forEachDescendant((node) => {
    if (node.getKind() !== SyntaxKind.CallExpression) return
    const call = node.asKindOrThrow(SyntaxKind.CallExpression)
    const expr = call.getExpression().getText()
    if (expr !== 't' && expr !== 'getServerT().t') return
    const arg = call.getArguments()[0]
    if (!arg || arg.getKind() !== SyntaxKind.StringLiteral) return
    const key = arg.getText().slice(1, -1)
    const value = key.split('.').reduce((o: any, k) => o?.[k], en)
    if (typeof value === 'string') call.replaceWithText(JSON.stringify(value))
  })
  sf.saveSync()
}
```

Run once: `npx tsx scripts/strip-i18n.ts`. Then ESLint custom rule blocks future `t()` calls in CI:

```js
// .eslintrc.js
'no-restricted-syntax': ['error', {
  selector: "CallExpression[callee.name='t']",
  message: 'i18n removed — hardcode English strings',
}]
```

For non-literal `t(key)` (template strings, dynamic keys): explicit mapping object replaces them. Manual review of every non-literal call.

**Don't ship a no-op `t()` shim.** Drags i18n weight into the bundle. Delete the hook entirely.

**Two-phase column drop optional pattern** (overkill for solo dev, worth knowing):

```sql
-- Phase 1: rename, observe a week
ALTER TABLE clubs RENAME COLUMN name_ka TO _deprecated_name_ka;
-- Phase 2 (1 week later):
ALTER TABLE clubs DROP COLUMN _deprecated_name_ka;
```

A SELECT against the old name fails immediately, surfaces the bug, doesn't lose data.

**Backup snapshot before drop:**

```bash
npx supabase db dump --data-only \
  -t public.clubs -t public.players -t public.leagues -t public.academy_announcements \
  > /tmp/pre-i18n-drop.sql
```

Reference path in migration comment.

**Bundle delta:**

- Translation files: ~12–15KB gzipped removed.
- Noto Sans Georgian font: ~30KB woff2 removed (one fewer font request).
- `LanguageContext` + `useLang` + Provider: ~3KB runtime.
- **Total: ~45KB gzipped + one font request.** Combined with Track 6: ~200–250KB gzipped off scout-facing bundle.

**Cookie residue** on user browsers: `lang` cookie persists, harmless, no code reads it. No cleanup needed.

**Move `Lang` type strip from Track 7 → Track 5** (per architecture-strategist) — chat files import `type { Lang }`, must be stripped before this directory deletion.

**Sources:**
- `supabase/migrations/20250101000030_fix_chat_security_issues.sql` (lines 137–218 — `get_conversations_with_metadata` references `cl.name_ka`)
- `supabase/migrations/20250101000033_protect_guardian_contact.sql` (lines 16–21 — column-level GRANT)
- `supabase/migrations/20250101000002_create_players.sql` (verifies `players._ka` column names)
- [ts-morph docs](https://ts-morph.com/) · [ESLint no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)

---

# Track 8 — Warmth Pass (Platform Surfaces)

## Overview

Dedicated polish pass to address `feedback_ui_redesign_hospital.md` on the rebuilt platform surfaces. Not a redesign — a deliberate set of small moves that add character without overhauling the design system. Runs after new surfaces ship; before launch.

## Reality vs Brief

- ✅ Light theme established with green primary (`#1B8A4A`).
- ✅ Tokens exist: `--background`, `--surface`, `--elevated`, `--primary`, `--foreground-secondary`, `--foreground-faint`.
- ⚠️ Surfaces use these tokens uniformly — flat reading.
- ⚠️ One sans typeface everywhere; Noto Serif scoped to `(public)/`.
- ⚠️ No texture, no patterns, no asymmetry, no hand-feel.
- ⚠️ Color usage is binary: green or grayscale.

## Moves

### A — Type system extension

Bring Noto Serif into the platform under controlled scope:
- Hero headlines on `/clubs`, `/clubs/[slug]`, `/leagues`, `/messages` empty states, admin dashboard welcome.
- Section titles inside long-form content.
- Body remains sans for legibility.
- Add `.serif` class, apply targeted.

### B — Surface variation

- Add `--surface-alt` token: subtly warmer than `--surface` (e.g., `#F0EBE3` light / `#1F1B17` dark).
- Long pages alternate between `--surface` and `--surface-alt`.
- Hero bands use `--background` directly; subtle vertical gradient from primary at 4% opacity.

### C — Texture

- Paper grain on hero bands — CSS-only SVG noise filter, ~3% opacity.
- Subtle dotted line dividers between sections, replacing default `1px border`.

### D — Type detail

- Drop caps on `history_text` first paragraph (`::first-letter`).
- Pull-quotes on the longest sentence (auto-detected; defer to v2 if complex).
- Small caps on metadata labels ("Founded", "Region", "Coach").

### E — Color permission

- Tier 1+ clubs: faint gold edge on card (warm yellow `#C9A35F` at 20% opacity).
- Active state on links: warm underline rather than green-400.
- Position badges: keep semantic colors but match warmth saturation (no fluorescent).

### F — Motion

- Card hover: lift 2px + soft shadow `0 8px 24px rgba(20, 16, 10, 0.06)`.
- Link hover: animated underline (left-to-right gradient).
- Empty state: fade in from below over 400ms.
- Mobile chat drawer: spring-eased slide.

### G — Empty states

Replace generic "No data" / "No clubs yet" with editorial copy + simple SVG marks.

### H — Photography

- Texture blocks: warm cream + primary green at low opacity.
- SVG patterns: hand-drawn stripes or dots, not geometric grids.
- Gradient meshes: warm cream → soft yellow → primary green, slow animation.
- Avoid: dark gradients, neon, glassmorphism, frosted blur.

### I — Spacing

Modernist-magazine spacing:
- Section padding: `py-16` minimum on long-form pages (was `py-8`).
- Hero bands: `py-24` desktop.
- Card grid gaps: 4px more than current.
- Letter-spacing on uppercase metadata.

## Implementation approach

- One PR per surface (Clubs, Leagues, Chat, Admin) for reviewable diffs.
- Add new tokens to `globals.css` once.
- Encapsulate texture via utility classes:

```css
.grain-bg     { /* SVG filter via background-image */ }
.surface-alt  { background: var(--surface-alt); }
.dotted-divider { background-image: radial-gradient(...); ... }
.serif        { font-family: 'Noto Serif', serif; }
```

## Performance / a11y guardrails

- SVG noise inline filter — zero asset weight.
- Animations use `transform` + `opacity` only.
- Avoid heavy `backdrop-filter: blur` (kills mobile perf).
- Drop caps + pull-quotes have screen-reader-friendly markup.
- `prefers-reduced-motion: reduce` disables card lift + drawer spring.
- New tokens pass WCAG AA against their pairings.
- Tokens added to BOTH light + dark theme maps; texture intensity differs per theme.

## Track 8 acceptance criteria

- [ ] Tokens added: `--surface-alt`, optional `--accent-warm`.
- [ ] `globals.css` has `.grain-bg`, `.surface-alt`, `.dotted-divider`, `.serif` utilities.
- [ ] `/clubs` directory: tier-1+ cards have warm edge; section spacing increased; surface alternation.
- [ ] `/clubs/[slug]`: hero band gradient + grain; About section serif title; History drop cap.
- [ ] `/leagues`: hero band warm; cards textured.
- [ ] `/messages`: empty state editorial + visual; section padding generous.
- [ ] `/admin`: dashboard welcome serif; cards use surface variation.
- [ ] All animations respect `prefers-reduced-motion`.
- [ ] Tokens present in light + dark.
- [ ] Manual visual review with Andria — explicit "no hospital vibes" sign-off.
- [ ] Lighthouse perf unchanged or improved.
- [ ] Mobile (375px, 414px) renders correctly.

### Research Insights

**Architectural recommendation: dissolve Track 8 as a standalone track.**

Standalone Track 8 produces predictable rework:
1. Each surface ships in "hospital" state, gets reviewed, gets blessed, then is reopened in Track 8 — duplicate review cycles + drift between as-built and the warmth spec.
2. Token additions (`--surface-alt`, `.grain-bg`, `.serif`) belong to the design system, not a surface. Adding them in Track 8 means every surface track was built against a system missing the right primitives — every surface gets retrofit-edited.

**Better framing:**

(a) **Tokens + utilities seed PR before Track 2** (small, ~1 hour): adds `--surface-alt`, `.grain-bg`, `.surface-alt`, `.dotted-divider`, `.serif`, motion utilities, `prefers-reduced-motion` guards.

(b) **Per-surface warmth checklist embedded into Tracks 2/3/4/5 acceptance** — concrete moves applied at build time, reviewed once.

Drop Track 8 as a standalone; keep "warmth review with Andria" as a master-acceptance gate.

**Reduce 9 sub-moves to 3 must-haves (per code-simplicity):**

1. **Typography:** serif headlines + 17–19px body + 1.55 line-height.
2. **Surface alternation + warm hero gradient:** `--surface` ↔ `--surface-alt` between sections; hero band uses `--background` + subtle vertical gradient.
3. **Card hover lift:** `transform: translateY(-2px)` + soft shadow `0 8px 24px rgba(20, 16, 10, 0.06)`.

**Defer:** pull-quotes (auto-detection genuinely complex), animated gradient meshes, dotted dividers, small caps on every metadata, drop caps on every long paragraph. Ship the 3, look at it with Andria, decide if more.

**Color discipline:**

- Never `#FFFFFF`. Use `oklch(98% 0.005 80)` or `#FDFCFA` (already in tokens).
- Tier 1+ clubs: faint gold edge highlight `#C9A35F` at 20% opacity on card border. Discreet, not "PAID TIER" label.
- Position badges keep semantic colors but match warmth saturation (no fluorescent).

**Type pairing (2026 editorial trends):**

- Display: **Source Serif 4**, **Fraunces**, or **Panta Display** (warm transitional serifs in vogue).
- UI body: Inter (already loaded) is fine. Söhne-style is warmer if licensing budget exists.
- **Don't** use Mrs Eaves at body size — display-only.

Bring Noto Serif (already loaded for landing) into platform under controlled scope: hero headlines on `/clubs`, `/clubs/[slug]`, `/leagues`, `/messages` empty states, admin dashboard welcome. Section titles inside long-form. Body stays sans for legibility on data-dense surfaces.

**Vary corner radii by hierarchy (0px / 2px / 12px):**

Uniform 8px radius reads dashboard-y. Editorial pages use varied radii: 0px on full-bleed hero (sharp), 2px on inline badges, 12px on cards.

**Texture:**

- **Paper grain on hero bands** — CSS-only SVG noise filter, `baseFrequency="0.9"`, low `numOctaves`, ~3% opacity. **Don't blur it** (`feGaussianBlur` is expensive). GPU-rasterized after first paint, ~1–2ms cost.
- **Subtle dotted dividers** between sections (deferred per simplicity).
- **Avoid** `backdrop-filter: blur` — kills mobile GPU.

**Motion guardrails:**

- Animations use `transform` + `opacity` only.
- Card hover lift: promote with `will-change: transform` only on hover-capable devices (`@media (hover: hover)`).
- `MobileChatDrawer` "spring-eased slide" — `transform: translateX()`, not `left:` keyframes.
- `prefers-reduced-motion: reduce` disables card lift + drawer spring globally.

**Empty states:** editorial copy + simple SVG marks. "Start a conversation with a Georgian academy" beats "No messages yet."

**Anti-patterns explicitly to avoid:**

- Uniform 8px radius on every card.
- `#FFFFFF` text on `#000000` background — use `#1A1917` on `#FDFCFA`.
- Centered everything (editorial leans left-aligned, ragged right).
- Drop shadows on hero sections (flat editorial > drop shadow chrome).
- Glassmorphism, frosted blur.

**Apply CardRedesign pattern from `docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md`:** left border for category (replaces top border), hover shadow lift, layered depth.

**Reference dark theme decisions** from `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md`: gold on white = 2.3:1 fails WCAG; gold with `color: var(--background)` = 8.6:1 passes (trophy/medal aesthetic). Apply to tier badges and premium CTAs.

**Performance budget (per performance-oracle):**

- SVG noise: zero asset weight.
- Drop caps + small caps: pure CSS, zero perf cost.
- All animations on `transform`/`opacity` — confirmed.
- Lighthouse perf budget: ≥90 on `/clubs` and `/clubs/[slug]` after warmth lands.

**Sources:**
- [NYT Magazine 2026 redesign — It's Nice That](https://www.itsnicethat.com/features/gail-bichler-the-new-york-times-magazine-redesign-publication-spotlight-080426)
- [Typography Trends 2026 — DesignMonks](https://www.designmonks.co/blog/typography-trends-2026)
- [10 Must-have Typefaces for 2026 — I Love Typography](https://ilovetypography.com/2025/12/19/10-must-have-fonts-for-2026/)
- `docs/brainstorms/2026-03-12-warm-dark-redesign-brainstorm.md` — CardRedesign pattern
- `docs/solutions/ui-redesign/warm-dark-gold-theme-redesign-globals-and-contrast.md` — accessibility precedents

---

# Cross-Cutting Concerns

## Auth and approval gate

- All platform routes (`(platform)/*`, `/admin/*`, `/platform/*`, `/messages`) sit behind their respective auth guards.
- Approval gate (`is_approved`) stays. Unapproved scouts → `/pending`.
- `getAdminContext()` and `getPlatformAdminContext()` continue as authorization helpers.
- Middleware fix (audit C1): no `/` redirect for logged-in users.

## Performance budgets

- Lighthouse perf ≥ 90 on `/clubs` directory after Track 2 lands.
- Lighthouse perf ≥ 90 on `/clubs/[slug]` after Track 8 lands (warmth without weight).
- Bundle size **drops** post-demolition (Track 6) and post-i18n (Track 7) — measure before/after, document delta.

## Accessibility

- Filter UI: keyboard-navigable selects.
- Image-heavy surfaces (gallery, hero): proper `alt` text, `next/image` with explicit dimensions.
- Live regions for chat (already in place).
- Focus management on route changes.
- All animations respect `prefers-reduced-motion`.

## Mobile

- All new surfaces work at 375px+.
- Chat mobile drawer animates (Track 5).
- Filter UI on `/clubs/[slug]` collapses to a sheet on mobile if grid feels cramped.

## English-only sweep policy

- Track 2 strips `t()` from clubs surface (sets precedent).
- Track 5 strips `t()` from chat.
- Track 7 sweeps everywhere else.
- New code added in any track: never adds `t()`. Hardcoded English only.

## CLAUDE.md

- The CLAUDE.md rewrite proposed earlier this session (descope Phase 7 → Phase 7 redesign + Phase 9 deferred Starlive API + English-only platform-wide) lands separately, **before** Track 1 begins.
- Then this master plan is referenced from CLAUDE.md.

---

# Master Acceptance Criteria

After all 9 tracks land:

## Functional

- [ ] Track 0: scope conflicts resolved, recorded in `MEMORY.md`.
- [ ] Track 1: schema migration applied, types regenerated, storage bucket exists.
- [ ] Track 2: `/clubs` + `/clubs/[slug]` rebuilt, navbar updated, middleware fixed.
- [ ] Track 3: `/leagues` link-out shipped (with placeholder URLs if Andria hasn't provided).
- [x] Track 4: academy admin can edit club logo / hero / history / gallery → public page reflects.
- [ ] Track 5: chat moved to `/messages`, redesigned, PlayerRefCard reworked, `t()` stripped.
- [ ] Track 6: demolition complete, `npm run build` clean, no `_archive/`.
- [ ] Track 7: zero `t()` calls, zero `useLang()`/`getServerT()`, `_ka` columns dropped.
- [ ] Track 8: warmth pass applied, Andria signs off "no hospital vibes."

## Non-functional

- [ ] All TS strict, no `any`.
- [ ] All Supabase calls check `.error` before `.data`.
- [ ] All actions have disabled/loading state.
- [ ] All copy English only.
- [ ] All forms Zod-validated.
- [ ] All routes auth-guarded.
- [ ] All migrations idempotent (`IF NOT EXISTS`).

## End-to-end smoke

- [ ] Anonymous → `/` → landing.
- [ ] Anonymous → `/clubs` → redirect to `/login`.
- [ ] Register → `/pending`.
- [ ] Approved scout → `/` → landing (no auto-redirect).
- [ ] Approved scout → `/clubs` → directory.
- [ ] Click into Iberia 1999 → detail with hero, history, roster, gallery, message button.
- [ ] Filter U17/MID → roster filters.
- [ ] Click Message Academy → thread opens at `/messages/[id]`.
- [ ] Click Leagues → three Starlive cards.
- [ ] Click a Starlive card → opens external in new tab.
- [ ] As academy admin → `/admin/club/edit` → upload hero photo → `/clubs/<my-slug>` reflects.
- [ ] As academy admin → `/admin/messages` → respond to scout.
- [ ] URL `/players` → 404.
- [ ] URL `/dashboard` → 404 (or redirect to `/`).
- [ ] URL `/matches` → 404.
- [ ] No Georgian strings render anywhere.

## Documentation

- [ ] `MEMORY.md` updated with Phase 7 resolutions.
- [ ] `Haveinmind.md` resolved entries struck through; pending entries (Starlive URLs, club tiebreaker, customization v2) remain.
- [ ] CLAUDE.md reflects new minimal surface, Phase 9 deferred Starlive, English-only, etc.

---

# Sources

- Codebase recon performed 2026-04-28.
- `CLAUDE.md` (project doc).
- `MEMORY.md` (auto-memory index).
- `Haveinmind.md` (launch-blocker tracking).
- Verbal brief from Andria, 2026-04-28 session.
- Memory files:
  - `project_launch_scope_minimal.md` — minimal scout surface.
  - `project_starlive_partnership.md` — link-out, not API.
  - `feedback_no_public_players_page.md` (updated 2026-04-28) — no Players surface anywhere.
  - `feedback_no_world_bridge.md` — public/platform separation.
  - `feedback_ui_redesign_hospital.md` — warmth requirement.
  - `feedback_visual_companion_whole_page.md` — mockup format.
  - `project_site_english_only.md` — English-only decision.
  - `project_partners.md` — Starlive + Free Football Agency.
- Existing plan archive at `docs/plans/` (March 2026) — platform-pivot history.
- Existing brainstorms at `docs/brainstorms/` (March 2026).
