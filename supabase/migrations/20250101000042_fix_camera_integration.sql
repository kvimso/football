-- Fix camera integration issues found during code review
-- 1. sync_logs.triggered_by_user FK: add ON DELETE SET NULL
-- 2. starlive_player_map: add updated_at trigger
-- 3. match_player_stats.source: add NOT NULL + CHECK constraint

-- ============================================================
-- 1. Fix sync_logs.triggered_by_user FK
-- ============================================================
-- Currently defaults to ON DELETE RESTRICT, which blocks
-- deleting a user profile that triggered any sync operation.
-- Audit logs should never block user removal.

ALTER TABLE public.sync_logs
  DROP CONSTRAINT sync_logs_triggered_by_user_fkey,
  ADD CONSTRAINT sync_logs_triggered_by_user_fkey
    FOREIGN KEY (triggered_by_user) REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- ============================================================
-- 2. Add updated_at trigger on starlive_player_map
-- ============================================================
-- Table has updated_at column but no auto-update trigger.
-- Without this, updated_at stays at initial insert time.

CREATE TRIGGER set_starlive_player_map_updated_at
  BEFORE UPDATE ON public.starlive_player_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Add NOT NULL + CHECK on match_player_stats.source
-- ============================================================
-- The old table (pre-migration 000041) had NOT NULL + CHECK via
-- migration 000018. The recreated table lost these constraints.

UPDATE public.match_player_stats SET source = 'pixellot' WHERE source IS NULL;

ALTER TABLE public.match_player_stats
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE public.match_player_stats
  ADD CONSTRAINT chk_mps_source CHECK (source IN ('pixellot'));
