-- ============================================================
-- RLS policies that reference the profiles table
-- Runs AFTER all tables are created (profiles in migration 7)
-- ============================================================

-- ========================
-- CLUBS
-- ========================
create policy "Platform admins can insert clubs"
  on public.clubs for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

create policy "Platform admins can update clubs"
  on public.clubs for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

create policy "Platform admins can delete clubs"
  on public.clubs for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

-- ========================
-- PLAYERS
-- ========================
create policy "Academy admins can insert players for their club"
  on public.players for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can update players for their club"
  on public.players for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can delete players for their club"
  on public.players for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

-- ========================
-- PLAYER SKILLS
-- ========================
create policy "Academy admins can insert player skills"
  on public.player_skills for insert
  with check (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_skills.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can update player skills"
  on public.player_skills for update
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_skills.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can delete player skills"
  on public.player_skills for delete
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_skills.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

-- ========================
-- PLAYER SEASON STATS
-- ========================
create policy "Academy admins can insert season stats"
  on public.player_season_stats for insert
  with check (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_season_stats.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can update season stats"
  on public.player_season_stats for update
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_season_stats.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can delete season stats"
  on public.player_season_stats for delete
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_season_stats.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

-- ========================
-- MATCHES
-- ========================
create policy "Academy admins can insert matches"
  on public.matches for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (
          profiles.club_id = matches.home_club_id
          or profiles.club_id = matches.away_club_id
          or profiles.role = 'platform_admin'
        )
    )
  );

create policy "Academy admins can update matches"
  on public.matches for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (
          profiles.club_id = matches.home_club_id
          or profiles.club_id = matches.away_club_id
          or profiles.role = 'platform_admin'
        )
    )
  );

create policy "Platform admins can delete matches"
  on public.matches for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

-- ========================
-- MATCH PLAYER STATS
-- ========================
create policy "Academy admins can insert match player stats"
  on public.match_player_stats for insert
  with check (
    exists (
      select 1 from public.profiles
      join public.matches on matches.id = match_player_stats.match_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (
          profiles.club_id = matches.home_club_id
          or profiles.club_id = matches.away_club_id
          or profiles.role = 'platform_admin'
        )
    )
  );

create policy "Academy admins can update match player stats"
  on public.match_player_stats for update
  using (
    exists (
      select 1 from public.profiles
      join public.matches on matches.id = match_player_stats.match_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (
          profiles.club_id = matches.home_club_id
          or profiles.club_id = matches.away_club_id
          or profiles.role = 'platform_admin'
        )
    )
  );

create policy "Academy admins can delete match player stats"
  on public.match_player_stats for delete
  using (
    exists (
      select 1 from public.profiles
      join public.matches on matches.id = match_player_stats.match_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (
          profiles.club_id = matches.home_club_id
          or profiles.club_id = matches.away_club_id
          or profiles.role = 'platform_admin'
        )
    )
  );

-- ========================
-- PROFILES (self-referencing policies)
-- ========================
create policy "Platform admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'platform_admin'
    )
  );

create policy "Academy admins can view scout profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'academy_admin'
    )
  );

create policy "Platform admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'platform_admin'
    )
  );

-- ========================
-- CONTACT REQUESTS
-- ========================
create policy "Academy admins can view requests for their club players"
  on public.contact_requests for select
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.club_id = profiles.club_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and players.id = contact_requests.player_id
    )
  );

create policy "Platform admins can view all requests"
  on public.contact_requests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

create policy "Scouts can create contact requests"
  on public.contact_requests for insert
  with check (
    auth.uid() = scout_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'scout'
    )
  );

create policy "Academy admins can update requests for their club"
  on public.contact_requests for update
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.club_id = profiles.club_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and players.id = contact_requests.player_id
    )
  );

create policy "Platform admins can update any request"
  on public.contact_requests for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

-- ========================
-- SHORTLISTS
-- ========================
create policy "Platform admins can view all shortlists"
  on public.shortlists for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

-- ========================
-- PLAYER VIDEOS
-- ========================
create policy "Academy admins can insert player videos"
  on public.player_videos for insert
  with check (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_videos.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can update player videos"
  on public.player_videos for update
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_videos.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );

create policy "Academy admins can delete player videos"
  on public.player_videos for delete
  using (
    exists (
      select 1 from public.profiles
      join public.players on players.id = player_videos.player_id
      where profiles.id = auth.uid()
        and profiles.role in ('academy_admin', 'platform_admin')
        and (profiles.club_id = players.club_id or profiles.role = 'platform_admin')
    )
  );
