-- Hackathon360: profiles table for role-based auth (id = auth.users.id)
-- Run in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('student', 'judge', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

alter table public.profiles enable row level security;

-- Users can read and update their own profile
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Allow insert (for trigger and for new signups; role comes from metadata)
create policy "Allow insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Trigger: create profile on signup with role from user_metadata
create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'student')
  )
  on conflict (id) do update set
    email = excluded.email,
    role = coalesce(nullif(trim(excluded.role), ''), profiles.role),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_profiles on auth.users;
create trigger on_auth_user_created_profiles
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
