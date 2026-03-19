-- Composite indexes for platform admin camera management pages
-- These optimize the queries used by /platform/camera/* pages

-- Sync logs: filtered pagination (status + reverse chronological)
CREATE INDEX IF NOT EXISTS idx_sync_logs_status_date
  ON public.sync_logs(status, created_at DESC);

-- Sync logs: unmapped players query (type + status filter)
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status
  ON public.sync_logs(sync_type, status);

-- Player mappings: club-filtered lookups
CREATE INDEX IF NOT EXISTS idx_spm_club
  ON public.starlive_player_map(club_id);
