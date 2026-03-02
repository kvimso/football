-- ============================================================
-- Migration: Add performance indexes on players table
--
-- - status: frequently filtered in player directory
-- - date_of_birth: age-range filtering uses DOB comparisons
-- - name/name_ka: ILIKE search via pg_trgm trigram indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_players_status ON public.players(status);
CREATE INDEX IF NOT EXISTS idx_players_dob ON public.players(date_of_birth);

-- Trigram indexes for ILIKE search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_players_name_trgm ON public.players USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_players_name_ka_trgm ON public.players USING gin(name_ka gin_trgm_ops);
