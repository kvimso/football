-- Drop the old no-arg overload of get_player_view_counts.
-- Migration _0030 created a version with player_ids DEFAULT NULL that
-- handles both cases, but the original from _0024 was never dropped,
-- causing "Could not choose the best candidate function" errors.
DROP FUNCTION IF EXISTS public.get_player_view_counts();
