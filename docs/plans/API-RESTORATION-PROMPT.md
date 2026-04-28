# API Restoration — Paste This Into Claude Code When Starlive Provides API Access

**When to use:** Starlive/Pixellot has given you API credentials and you're ready to re-enable the full platform.

---

## Context for Claude Code

Read CLAUDE.md for full project context. This is a continuation of the platform pivot from March 2026.

**What happened:** In March 2026, we stripped data-dependent routes (players, matches, watchlist, comparison, AI search) because our camera data partner Starlive couldn't provide an API. We pivoted to a league portal + demo request model. All stripped code was preserved on the `full-platform-backup` branch.

**What's happening now:** Starlive has provided API credentials. We're restoring the full platform.

---

## Step-by-step plan

### Phase 1: Merge backup branch and resolve conflicts

```bash
git checkout main
git pull origin main
git checkout -b feature/restore-full-platform
git merge full-platform-backup
```

Expect merge conflicts in:
- `src/middleware.ts` — keep the NEW approval gate logic, but re-add the protected route prefixes for `/players`, `/matches`, `/dashboard/watchlist`
- `src/components/layout/Navbar.tsx` — keep the approval-aware nav structure, but ADD BACK Players and Matches links for approved scouts
- `src/components/layout/Footer.tsx` — add Players and Matches links back
- `src/components/player/PlayerCard.tsx` — restore the `<Link>` wrapper (undo the non-clickable div change)
- `src/components/chat/PlayerRefCard.tsx` — restore the link
- `src/components/dashboard/DashboardSidebar.tsx` — add Watchlist back
- `src/app/dashboard/page.tsx` — restore the full dashboard (but keep league cards section from the pivot)
- `src/app/dashboard/layout.tsx` — restore watchlist query
- `src/components/landing/LandingNav.tsx` — CTA should now go to `/players` again
- `src/components/about/AboutContent.tsx` — restore `/players` CTA
- `src/components/chat/ChatInbox.tsx`, `ChatEmptyState.tsx` — restore `/players` CTAs
- `next.config.ts` — REMOVE the `/players/:path*` and `/matches/:path*` redirects

For each conflict: the NEW code (from main) has the approval gate, theme system, leagues, demo requests. The OLD code (from backup) has the player/match routes. Merge both — keep the new infrastructure, restore the old routes.

### Phase 2: Configure Pixellot API

1. Add environment variables:
```bash
PIXELLOT_API_URL=<from Starlive>
PIXELLOT_API_KEY=<from Starlive>
PIXELLOT_WEBHOOK_SECRET=<from Starlive>
```

2. The API client already exists at `src/lib/camera/client.ts` — update the base URL and auth if Starlive's actual API differs from our spec.

3. Test the connection:
```bash
# Create a test script or use the manual sync endpoint
curl -X POST http://localhost:3000/api/camera/sync \
  -H "Authorization: Bearer <service-role-key>"
```

### Phase 3: Update navigation for restored features

**Approved scout nav should become:**
`Leagues | Players | Matches | Messages | [User menu]`

**Unapproved scout nav stays:**
`Leagues | Request Demo | [User menu]`

This means Players and Matches are PREMIUM features — only visible to approved (paying) scouts. The approval gate naturally handles this.

### Phase 4: Update landing page

Re-add mentions of:
- Player profiles with verified camera stats
- Player comparison tool
- Advanced filtering
- Radar charts and stat breakdowns

Update the "How it Works" section to include player browsing again.

### Phase 5: Verify everything

```bash
npm run build          # Must pass clean
npm run dev            # Manual test all routes
```

Test these flows:
1. Anonymous → landing → register → pending → approved → players/matches/dashboard work
2. Existing approved scout → can see Players and Matches in nav
3. Camera sync → match data appears → player stats update
4. Club page → PlayerCards are clickable again → lead to profile
5. Chat → PlayerRefCard links work → PlayerSearchModal works
6. Dashboard → watchlist is back, full activity feed

### Phase 6: Deploy

```bash
# Add env vars to Vercel first
printf '<PIXELLOT_API_URL>' | npx vercel env add PIXELLOT_API_URL production
printf '<PIXELLOT_API_KEY>' | npx vercel env add PIXELLOT_API_KEY production
printf '<PIXELLOT_WEBHOOK_SECRET>' | npx vercel env add PIXELLOT_WEBHOOK_SECRET production

npx vercel --prod --force
```

---

## Key decisions for the merge

1. **Keep the approval gate** — it's now the paywall. Scouts must be approved (= paid) to access player data.
2. **Keep leagues page** — it's additional value, not a replacement anymore.
3. **Keep demo request flow** — it's the sales funnel, still needed.
4. **Keep /pending page** — unapproved scouts still need a waiting room.
5. **Keep the theme system** — whatever design state exists at merge time.
6. **Restore all player/match routes** — they go back into `(platform)/` route group (auth + approval required).
7. **NotificationBell** — restore it to Navbar if notification sources are back.

---

## What NOT to do

- Don't delete the leagues page or demo request system — they're additive
- Don't remove the approval gate — it serves as the subscription barrier
- Don't force-push or rewrite history on main
- Don't delete the `full-platform-backup` branch after merge — keep it as a reference
