-- Hackathon360: users (profiles), submissions, scores
-- Run this in Supabase SQL Editor or via Supabase CLI.

-- Public users table (synced with auth.users; role-based)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student', 'judge', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Submissions (one per student for this hackathon; extend if multiple allowed)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  github_url text not null,
  description text,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'scored')),
  qr_code text,
  github_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Scores from judges
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  judge_id uuid not null references public.users(id) on delete cascade,
  innovation numeric(4,2) not null check (innovation >= 0 and innovation <= 10),
  technical numeric(4,2) not null check (technical >= 0 and technical <= 10),
  impact numeric(4,2) not null check (impact >= 0 and impact <= 10),
  feasibility numeric(4,2) not null check (feasibility >= 0 and feasibility <= 10),
  total numeric(5,2) generated always as (innovation + technical + impact + feasibility) stored,
  created_at timestamptz not null default now(),
  unique(submission_id, judge_id)
);

-- Indexes
create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_scores_submission_id on public.scores(submission_id);
create index if not exists idx_scores_judge_id on public.scores(judge_id);

-- RLS
alter table public.users enable row level security;
alter table public.submissions enable row level security;
alter table public.scores enable row level security;

-- Users: students can read/update own row; insert on signup (trigger runs with new user session)
create policy "Users can read own row" on public.users for select using (auth.uid() = id);
create policy "Users can update own row" on public.users for update using (auth.uid() = id);
create policy "Users can insert own row" on public.users for insert with check (auth.uid() = id);
create policy "Service role can insert users" on public.users for insert with check (auth.jwt() ->> 'role' = 'service_role');

-- Submissions: students insert/update/read own; all authenticated can read for leaderboard
create policy "Users can insert own submission" on public.submissions for insert with check (auth.uid() = user_id);
create policy "Users can update own submission" on public.submissions for update using (auth.uid() = user_id);
create policy "Users can read own submission" on public.submissions for select using (auth.uid() = user_id);
create policy "Anyone authenticated can read all submissions (leaderboard)" on public.submissions for select using (auth.role() = 'authenticated');

-- Scores: judges insert (handled in app); everyone can read for leaderboard
create policy "Anyone authenticated can read scores" on public.scores for select using (auth.role() = 'authenticated');
create policy "Service role can insert scores" on public.scores for insert with check (true);

-- Trigger: create user row on signup (role = student from metadata)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
