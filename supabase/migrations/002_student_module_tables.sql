-- Hackathon360 Student Module: students + submissions (student_id)
-- Run in Supabase SQL Editor. Uses anon key for client inserts.

-- Students (registration)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Submissions table (student_id FK). Named "submissions" per requirement.
-- Run this migration on a project that does NOT already have public.submissions (e.g. skip 001, or drop existing submissions first).
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  github_url text not null,
  description text,
  qr_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_student_id on public.submissions(student_id);

alter table public.students enable row level security;
alter table public.submissions enable row level security;

create policy "Allow insert students" on public.students for insert with check (true);
create policy "Allow select students" on public.students for select using (true);

create policy "Allow insert submissions" on public.submissions for insert with check (true);
create policy "Allow select submissions" on public.submissions for select using (true);
