-- Contact messages from the public contact form
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.contact_messages enable row level security;

-- Allow anyone to insert (public form)
create policy "Anyone can insert contact messages"
  on public.contact_messages
  for insert
  with check (true);

-- Only service role can read (admin dashboard later)
-- No SELECT policy for anon/authenticated — messages are private
