-- ============================================================
-- Fix infinite recursion in RLS policies
--
-- Problem: Policies on various tables subquery `profiles` to check role.
-- But `profiles` has its own RLS policies that also subquery `profiles`.
-- This causes infinite recursion.
--
-- Solution: Create SECURITY DEFINER helper functions that bypass RLS
-- to read the current user's role and club_id. Then rewrite all
-- policies to use these helpers instead of subquerying profiles directly.
-- ============================================================

-- Helper: get current user's role (bypasses RLS)
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper: get current user's club_id (bypasses RLS)
create or replace function public.get_user_club_id()
returns uuid as $$
  select club_id from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- Drop ALL profiles self-referencing policies (the recursive ones)
-- ============================================================
drop policy if exists "Platform admins can view all profiles" on public.profiles;
drop policy if exists "Academy admins can view scout profiles" on public.profiles;
drop policy if exists "Platform admins can update any profile" on public.profiles;

-- Recreate them using the helper functions (no recursion)
create policy "Platform admins can view all profiles"
  on public.profiles for select
  using (public.get_user_role() = 'platform_admin');

create policy "Academy admins can view scout profiles"
  on public.profiles for select
  using (public.get_user_role() = 'academy_admin');

create policy "Platform admins can update any profile"
  on public.profiles for update
  using (public.get_user_role() = 'platform_admin');

-- ============================================================
-- Drop and recreate CLUBS policies
-- ============================================================
drop policy if exists "Platform admins can insert clubs" on public.clubs;
drop policy if exists "Platform admins can update clubs" on public.clubs;
drop policy if exists "Platform admins can delete clubs" on public.clubs;

create policy "Platform admins can insert clubs"
  on public.clubs for insert
  with check (public.get_user_role() = 'platform_admin');

create policy "Platform admins can update clubs"
  on public.clubs for update
  using (public.get_user_role() = 'platform_admin');

create policy "Platform admins can delete clubs"
  on public.clubs for delete
  using (public.get_user_role() = 'platform_admin');

-- ============================================================
-- Drop and recreate PLAYERS policies
-- ============================================================
drop policy if exists "Academy admins can insert players for their club" on public.players;
drop policy if exists "Academy admins can update players for their club" on public.players;
drop policy if exists "Academy admins can delete players for their club" on public.players;

create policy "Academy admins can insert players for their club"
  on public.players for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = club_id or public.get_user_role() = 'platform_admin')
  );

create policy "Academy admins can update players for their club"
  on public.players for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = club_id or public.get_user_role() = 'platform_admin')
  );

create policy "Academy admins can delete players for their club"
  on public.players for delete
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (public.get_user_club_id() = club_id or public.get_user_role() = 'platform_admin')
  );

-- ============================================================
-- Drop and recreate PLAYER SKILLS policies
-- ============================================================
drop policy if exists "Academy admins can insert player skills" on public.player_skills;
drop policy if exists "Academy admins can update player skills" on public.player_skills;
drop policy if exists "Academy admins can delete player skills" on public.player_skills;

create policy "Academy admins can insert player skills"
  on public.player_skills for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_skills.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can update player skills"
  on public.player_skills for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_skills.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can delete player skills"
  on public.player_skills for delete
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_skills.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

-- ============================================================
-- Drop and recreate PLAYER SEASON STATS policies
-- ============================================================
drop policy if exists "Academy admins can insert season stats" on public.player_season_stats;
drop policy if exists "Academy admins can update season stats" on public.player_season_stats;
drop policy if exists "Academy admins can delete season stats" on public.player_season_stats;

create policy "Academy admins can insert season stats"
  on public.player_season_stats for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_season_stats.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can update season stats"
  on public.player_season_stats for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_season_stats.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can delete season stats"
  on public.player_season_stats for delete
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_season_stats.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

-- ============================================================
-- Drop and recreate MATCHES policies
-- ============================================================
drop policy if exists "Academy admins can insert matches" on public.matches;
drop policy if exists "Academy admins can update matches" on public.matches;
drop policy if exists "Platform admins can delete matches" on public.matches;

create policy "Academy admins can insert matches"
  on public.matches for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (
      public.get_user_club_id() = home_club_id
      or public.get_user_club_id() = away_club_id
      or public.get_user_role() = 'platform_admin'
    )
  );

create policy "Academy admins can update matches"
  on public.matches for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and (
      public.get_user_club_id() = home_club_id
      or public.get_user_club_id() = away_club_id
      or public.get_user_role() = 'platform_admin'
    )
  );

create policy "Platform admins can delete matches"
  on public.matches for delete
  using (public.get_user_role() = 'platform_admin');

-- ============================================================
-- Drop and recreate MATCH PLAYER STATS policies
-- ============================================================
drop policy if exists "Academy admins can insert match player stats" on public.match_player_stats;
drop policy if exists "Academy admins can update match player stats" on public.match_player_stats;
drop policy if exists "Academy admins can delete match player stats" on public.match_player_stats;

create policy "Academy admins can insert match player stats"
  on public.match_player_stats for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.matches
      where matches.id = match_player_stats.match_id
        and (
          public.get_user_club_id() = matches.home_club_id
          or public.get_user_club_id() = matches.away_club_id
          or public.get_user_role() = 'platform_admin'
        )
    )
  );

create policy "Academy admins can update match player stats"
  on public.match_player_stats for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.matches
      where matches.id = match_player_stats.match_id
        and (
          public.get_user_club_id() = matches.home_club_id
          or public.get_user_club_id() = matches.away_club_id
          or public.get_user_role() = 'platform_admin'
        )
    )
  );

create policy "Academy admins can delete match player stats"
  on public.match_player_stats for delete
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.matches
      where matches.id = match_player_stats.match_id
        and (
          public.get_user_club_id() = matches.home_club_id
          or public.get_user_club_id() = matches.away_club_id
          or public.get_user_role() = 'platform_admin'
        )
    )
  );

-- ============================================================
-- Drop and recreate CONTACT REQUESTS policies
-- ============================================================
drop policy if exists "Academy admins can view requests for their club players" on public.contact_requests;
drop policy if exists "Platform admins can view all requests" on public.contact_requests;
drop policy if exists "Scouts can create contact requests" on public.contact_requests;
drop policy if exists "Academy admins can update requests for their club" on public.contact_requests;
drop policy if exists "Platform admins can update any request" on public.contact_requests;

create policy "Academy admins can view requests for their club players"
  on public.contact_requests for select
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = contact_requests.player_id
        and players.club_id = public.get_user_club_id()
    )
  );

create policy "Platform admins can view all requests"
  on public.contact_requests for select
  using (public.get_user_role() = 'platform_admin');

create policy "Scouts can create contact requests"
  on public.contact_requests for insert
  with check (
    auth.uid() = scout_id
    and public.get_user_role() = 'scout'
  );

create policy "Academy admins can update requests for their club"
  on public.contact_requests for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = contact_requests.player_id
        and players.club_id = public.get_user_club_id()
    )
  );

create policy "Platform admins can update any request"
  on public.contact_requests for update
  using (public.get_user_role() = 'platform_admin');

-- ============================================================
-- Drop and recreate SHORTLISTS admin policy
-- ============================================================
drop policy if exists "Platform admins can view all shortlists" on public.shortlists;

create policy "Platform admins can view all shortlists"
  on public.shortlists for select
  using (public.get_user_role() = 'platform_admin');

-- ============================================================
-- Drop and recreate PLAYER VIDEOS policies
-- ============================================================
drop policy if exists "Academy admins can insert player videos" on public.player_videos;
drop policy if exists "Academy admins can update player videos" on public.player_videos;
drop policy if exists "Academy admins can delete player videos" on public.player_videos;

create policy "Academy admins can insert player videos"
  on public.player_videos for insert
  with check (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_videos.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can update player videos"
  on public.player_videos for update
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_videos.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );

create policy "Academy admins can delete player videos"
  on public.player_videos for delete
  using (
    public.get_user_role() in ('academy_admin', 'platform_admin')
    and exists (
      select 1 from public.players
      where players.id = player_videos.player_id
        and (players.club_id = public.get_user_club_id() or public.get_user_role() = 'platform_admin')
    )
  );
