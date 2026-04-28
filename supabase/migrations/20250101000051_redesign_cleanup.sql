-- Phase 7 Track 6 — Demolition cleanup.
-- Drops scout-facing watchlist, view-tracking, and demand RPCs that backed the
-- discovery surface killed by the redesign. Snapshot of pre-drop rows lives at
-- docs/backups/2026-04-28_track-6_pre-demolition.json (36 rows total, dev-seeded).
--
-- RPCs are dropped before tables because PostgreSQL late-binds table names in
-- function bodies — CASCADE on the table would leave the RPC in place and crash
-- at first call with "relation does not exist".

-- 1. Demand + view RPCs (functions reference player_views/watchlist late-bound)
DROP FUNCTION IF EXISTS public.get_player_scout_demand(uuid);
DROP FUNCTION IF EXISTS public.get_scout_demand_by_country(uuid);
DROP FUNCTION IF EXISTS public.get_scout_demand_last_month(uuid);
DROP FUNCTION IF EXISTS public.get_player_view_counts(uuid[]);

-- 2. Watchlist tree (children first → parents → tags). All FKs are internal to
--    this set; no surviving table references these.
DROP TABLE IF EXISTS public.watchlist_tags CASCADE;
DROP TABLE IF EXISTS public.watchlist_folder_players CASCADE;
DROP TABLE IF EXISTS public.watchlist_folders CASCADE;
DROP TABLE IF EXISTS public.watchlist CASCADE;

-- 3. Player view tracking (gone — scouts have no player surface)
DROP TABLE IF EXISTS public.player_views CASCADE;

-- 4. contact_requests: keep historical rows for the platform admin view, but
--    revoke the scout INSERT path so a deleted endpoint can't be reached via
--    direct PostgREST calls (security finding F9).
DROP POLICY IF EXISTS "Scouts can insert contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Club admins can update contact requests" ON public.contact_requests;

-- 5. PostgREST schema cache reload — without this, the API returns stale
--    shapes (or 200s with dropped columns) for ~10 minutes.
NOTIFY pgrst, 'reload schema';
