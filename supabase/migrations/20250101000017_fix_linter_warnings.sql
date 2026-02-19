-- ============================================================
-- Fix Supabase database linter warnings
--
-- 1. Function search paths (security)
-- 2. Consolidate permissive RLS policies (performance)
-- 3. Wrap auth.uid() in (select auth.uid()) (performance)
-- 4. Add missing foreign key indexes (performance)
-- ============================================================

-- ============================================================
-- 1. FIX FUNCTION SEARCH PATHS
-- All functions need SET search_path = '' to prevent
-- search path injection attacks. Use fully-qualified names.
-- ============================================================

-- 1a. get_user_role()
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = (select auth.uid())
$$ language sql security definer stable set search_path = '';

-- 1b. get_user_club_id()
create or replace function public.get_user_club_id()
returns uuid as $$
  select club_id from public.profiles where id = (select auth.uid())
$$ language sql security definer stable set search_path = '';

-- 1c. generate_platform_id()
create or replace function public.generate_platform_id()
returns trigger as $$
begin
  if new.platform_id is null then
    new.platform_id := 'GFP-' || lpad(nextval('public.player_platform_id_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql set search_path = '';

-- 1d. handle_new_user()
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, organization, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    'scout'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- 1e. update_updated_at_column()
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = '';


-- ============================================================
-- 2. CONSOLIDATE PERMISSIVE RLS POLICIES
-- Multiple permissive policies per table/role/action get OR'd
-- and each must be evaluated. Consolidate into single policies.
-- Also wrap auth.uid() in (select auth.uid()) for initplan fix.
-- ============================================================

-- ============================================================
-- 2a. PROFILES TABLE
-- ============================================================

-- Drop all existing SELECT policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Academy admins can view scout profiles" on public.profiles;
drop policy if exists "Platform admins can view all profiles" on public.profiles;

-- Consolidated SELECT: own profile, academy admins, platform admins
create policy "Users can view profiles"
  on public.profiles for select
  using (
    (select auth.uid()) = id
    or public.get_user_role() = 'academy_admin'
    or public.get_user_role() = 'platform_admin'
  );

-- Drop all existing UPDATE policies
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Platform admins can update any profile" on public.profiles;

-- Consolidated UPDATE: own profile or platform admin
create policy "Users can update profiles"
  on public.profiles for update
  using (
    (select auth.uid()) = id
    or public.get_user_role() = 'platform_admin'
  )
  with check (
    (select auth.uid()) = id
    or public.get_user_role() = 'platform_admin'
  );

-- ============================================================
-- 2b. CONTACT REQUESTS TABLE
-- ============================================================

-- Drop all existing SELECT policies
drop policy if exists "Scouts can view their own requests" on public.contact_requests;
drop policy if exists "Academy admins can view requests for their club players" on public.contact_requests;
drop policy if exists "Platform admins can view all requests" on public.contact_requests;

-- Consolidated SELECT: own requests, academy admin for club players, platform admin
create policy "Users can view contact requests"
  on public.contact_requests for select
  using (
    (select auth.uid()) = scout_id
    or public.get_user_role() = 'platform_admin'
    or (
      public.get_user_role() = 'academy_admin'
      and exists (
        select 1 from public.players
        where players.id = contact_requests.player_id
          and players.club_id = public.get_user_club_id()
      )
    )
  );

-- Drop all existing UPDATE policies
drop policy if exists "Academy admins can update requests for their club" on public.contact_requests;
drop policy if exists "Platform admins can update any request" on public.contact_requests;

-- Consolidated UPDATE: academy admin for club players, platform admin
create policy "Admins can update contact requests"
  on public.contact_requests for update
  using (
    public.get_user_role() = 'platform_admin'
    or (
      public.get_user_role() = 'academy_admin'
      and exists (
        select 1 from public.players
        where players.id = contact_requests.player_id
          and players.club_id = public.get_user_club_id()
      )
    )
  );

-- Drop and recreate INSERT to fix auth.uid() initplan
drop policy if exists "Scouts can create contact requests" on public.contact_requests;

create policy "Scouts can create contact requests"
  on public.contact_requests for insert
  with check (
    (select auth.uid()) = scout_id
    and public.get_user_role() = 'scout'
  );

-- ============================================================
-- 2c. SHORTLISTS TABLE
-- ============================================================

-- Drop all existing SELECT policies
drop policy if exists "Scouts can view their own shortlist" on public.shortlists;
drop policy if exists "Academy admins can view shortlists for their club players" on public.shortlists;
drop policy if exists "Platform admins can view all shortlists" on public.shortlists;

-- Consolidated SELECT: own shortlist, academy admin for club players, platform admin
create policy "Users can view shortlists"
  on public.shortlists for select
  using (
    (select auth.uid()) = scout_id
    or public.get_user_role() = 'platform_admin'
    or (
      public.get_user_role() = 'academy_admin'
      and exists (
        select 1 from public.players
        where players.id = shortlists.player_id
          and players.club_id = public.get_user_club_id()
      )
    )
  );

-- Drop and recreate INSERT to fix auth.uid() initplan
drop policy if exists "Scouts can add to their shortlist" on public.shortlists;

create policy "Scouts can add to their shortlist"
  on public.shortlists for insert
  with check ((select auth.uid()) = scout_id);

-- Drop and recreate UPDATE to fix auth.uid() initplan
drop policy if exists "Scouts can update their shortlist" on public.shortlists;

create policy "Scouts can update their shortlist"
  on public.shortlists for update
  using ((select auth.uid()) = scout_id)
  with check ((select auth.uid()) = scout_id);

-- Drop and recreate DELETE to fix auth.uid() initplan
drop policy if exists "Scouts can delete from their shortlist" on public.shortlists;

create policy "Scouts can delete from their shortlist"
  on public.shortlists for delete
  using ((select auth.uid()) = scout_id);


-- ============================================================
-- 3. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================

create index if not exists idx_contact_requests_responded_by
  on public.contact_requests(responded_by);

create index if not exists idx_matches_home_club
  on public.matches(home_club_id);

create index if not exists idx_matches_away_club
  on public.matches(away_club_id);

create index if not exists idx_player_videos_player
  on public.player_videos(player_id);

create index if not exists idx_player_videos_match
  on public.player_videos(match_id);

create index if not exists idx_profiles_club
  on public.profiles(club_id);

create index if not exists idx_shortlists_player
  on public.shortlists(player_id);
