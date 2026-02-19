-- Page view analytics
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,  -- 'player' | 'club' | 'match'
  entity_id uuid,
  entity_slug text,
  viewed_at timestamptz default now()
);

create index idx_page_views_entity on page_views(page_type, entity_id);
create index idx_page_views_date on page_views(viewed_at desc);

alter table public.page_views enable row level security;

-- No user-facing SELECT policy; reads via service role only
create policy "Anyone can insert page views"
  on public.page_views for insert
  with check (true);
