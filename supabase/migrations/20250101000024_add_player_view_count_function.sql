-- RPC function to aggregate player view counts efficiently
-- Replaces unbounded 10k-row fetches with database-level aggregation
CREATE OR REPLACE FUNCTION get_player_view_counts()
RETURNS TABLE(player_id uuid, total_views bigint, weekly_views bigint, prev_week_views bigint) AS $$
  SELECT
    player_id,
    COUNT(*) AS total_views,
    COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') AS weekly_views,
    COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '14 days' AND viewed_at < NOW() - INTERVAL '7 days') AS prev_week_views
  FROM player_views
  GROUP BY player_id
$$ LANGUAGE sql STABLE;

-- Allow any authenticated user to read player_views (aggregated counts are not sensitive)
-- This lets platform pages use the regular supabase client instead of the admin client
CREATE POLICY "Authenticated users can read player views"
  ON player_views FOR SELECT
  TO authenticated
  USING (true);
