-- Authenticated player view tracking (distinct from anonymous page_views)
create table public.player_views (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- Query patterns: views per player, views per viewer, recent views, dedup check
create index idx_player_views_player on player_views(player_id);
create index idx_player_views_viewer on player_views(viewer_id);
create index idx_player_views_date on player_views(viewed_at desc);
create index idx_player_views_dedup on player_views(player_id, viewer_id, viewed_at desc);

alter table public.player_views enable row level security;

-- INSERT: authenticated users can insert their own views
create policy "Users can insert own views"
  on public.player_views for insert
  to authenticated
  with check (auth.uid() = viewer_id);

-- SELECT for scouts: own views only
create policy "Users can read own views"
  on public.player_views for select
  to authenticated
  using (auth.uid() = viewer_id);

-- SELECT for academy admins: views on their club's players
create policy "Academy admins can read views on their players"
  on public.player_views for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      join public.players pl on pl.club_id = p.club_id
      where p.id = auth.uid()
        and p.role = 'academy_admin'
        and pl.id = player_views.player_id
    )
  );

-- SELECT for platform admins: all views
create policy "Platform admins can read all views"
  on public.player_views for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'platform_admin'
    )
  );
