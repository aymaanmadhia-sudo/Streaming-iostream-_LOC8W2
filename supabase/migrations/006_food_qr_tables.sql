-- Food coupons and QR attendance for dashboard
create table if not exists public.food_coupons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  code text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

create index if not exists idx_food_coupons_student on public.food_coupons(student_id);
create index if not exists idx_qr_scans_submission on public.qr_scans(submission_id);

alter table public.food_coupons enable row level security;
alter table public.qr_scans enable row level security;

create policy "Allow all food_coupons" on public.food_coupons for all using (true) with check (true);
create policy "Allow all qr_scans" on public.qr_scans for all using (true) with check (true);
