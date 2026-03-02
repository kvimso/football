-- Drop academy_admin write policies on camera-only tables
-- CLAUDE.md: "No club admin access to matches/stats/videos — camera-only tables"
-- Only service_role (camera API) should write to these tables.
-- Platform admins retain access via their separate policy conditions.

-- player_skills
DROP POLICY IF EXISTS "Academy admins can insert player skills" ON public.player_skills;
DROP POLICY IF EXISTS "Academy admins can update player skills" ON public.player_skills;
DROP POLICY IF EXISTS "Academy admins can delete player skills" ON public.player_skills;

-- player_season_stats
DROP POLICY IF EXISTS "Academy admins can insert season stats" ON public.player_season_stats;
DROP POLICY IF EXISTS "Academy admins can update season stats" ON public.player_season_stats;
DROP POLICY IF EXISTS "Academy admins can delete season stats" ON public.player_season_stats;

-- matches (insert + update only; delete is already platform_admin-only)
DROP POLICY IF EXISTS "Academy admins can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Academy admins can update matches" ON public.matches;

-- match_player_stats
DROP POLICY IF EXISTS "Academy admins can insert match player stats" ON public.match_player_stats;
DROP POLICY IF EXISTS "Academy admins can update match player stats" ON public.match_player_stats;
DROP POLICY IF EXISTS "Academy admins can delete match player stats" ON public.match_player_stats;

-- player_videos
DROP POLICY IF EXISTS "Academy admins can insert player videos" ON public.player_videos;
DROP POLICY IF EXISTS "Academy admins can update player videos" ON public.player_videos;
DROP POLICY IF EXISTS "Academy admins can delete player videos" ON public.player_videos;

-- Re-create write policies for platform_admin only on these tables
-- (The dropped policies had `role in ('academy_admin', 'platform_admin')`)

-- player_skills: platform_admin only
CREATE POLICY "Platform admins can insert player skills"
  ON public.player_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update player skills"
  ON public.player_skills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can delete player skills"
  ON public.player_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

-- player_season_stats: platform_admin only
CREATE POLICY "Platform admins can insert season stats"
  ON public.player_season_stats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update season stats"
  ON public.player_season_stats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can delete season stats"
  ON public.player_season_stats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

-- matches: platform_admin insert + update (delete already exists as platform_admin-only)
CREATE POLICY "Platform admins can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

-- match_player_stats: platform_admin only
CREATE POLICY "Platform admins can insert match player stats"
  ON public.match_player_stats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update match player stats"
  ON public.match_player_stats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can delete match player stats"
  ON public.match_player_stats FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

-- player_videos: platform_admin only
CREATE POLICY "Platform admins can insert player videos"
  ON public.player_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can update player videos"
  ON public.player_videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );

CREATE POLICY "Platform admins can delete player videos"
  ON public.player_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'platform_admin'
    )
  );
