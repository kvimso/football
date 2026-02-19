-- Update handle_new_user() to support invited academy admins.
-- When inviteUserByEmail() is called with data: { role: 'academy_admin', club_id: '<uuid>' },
-- the trigger reads metadata and creates the profile with the correct role and club.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _role text;
  _club_id uuid;
begin
  -- Check if user was invited with specific role metadata
  _role := coalesce(new.raw_user_meta_data->>'role', 'scout');

  -- Only allow 'scout' or 'academy_admin' from metadata (prevents platform_admin escalation)
  if _role not in ('scout', 'academy_admin') then
    _role := 'scout';
  end if;

  -- Extract club_id if provided (only relevant for academy_admin)
  if _role = 'academy_admin' and new.raw_user_meta_data->>'club_id' is not null then
    _club_id := (new.raw_user_meta_data->>'club_id')::uuid;
    -- Verify the club actually exists
    if not exists (select 1 from public.clubs where id = _club_id) then
      _club_id := null;
      _role := 'scout';
    end if;
  else
    _club_id := null;
  end if;

  insert into public.profiles (id, email, full_name, organization, role, club_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'organization', ''),
    _role,
    _club_id
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';
