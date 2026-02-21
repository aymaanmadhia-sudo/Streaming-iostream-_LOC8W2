-- ============================================================
-- HACKATHON360: Run this ENTIRE file in Supabase SQL Editor
-- Dashboard: SQL Editor → New query → Paste → Run
-- ============================================================

-- 1. Students (for anon registration)
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert students" ON public.students;
DROP POLICY IF EXISTS "Allow select students" ON public.students;
CREATE POLICY "Allow insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select students" ON public.students FOR SELECT USING (true);

-- 2. Profiles (for auth users: admin, judge, student)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'judge', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Trigger for profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'student'))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS on_auth_user_created_profiles ON auth.users;
CREATE TRIGGER on_auth_user_created_profiles AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 3. Submissions (student_id from students table)
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  github_url text NOT NULL,
  description text,
  demo_url text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'scored', 'evaluated', 'pending', 'approved', 'rejected')),
  qr_code text,
  github_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions(student_id);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow select submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow update submissions" ON public.submissions;
CREATE POLICY "Allow insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow update submissions" ON public.submissions FOR UPDATE USING (true);

-- 4. If submissions already exists from 001 (user_id schema), add student_id and fix
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS demo_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text DEFAULT 'submitted';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS github_verified_at timestamptz;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check1;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check CHECK (status IN ('draft', 'submitted', 'under_review', 'scored', 'evaluated', 'pending', 'approved', 'rejected'));

-- 5. Scores (for judges)
CREATE TABLE IF NOT EXISTS public.scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  innovation numeric(4,2) NOT NULL CHECK (innovation >= 0 AND innovation <= 10),
  uiux numeric(4,2) CHECK (uiux >= 0 AND uiux <= 10),
  technical numeric(4,2) NOT NULL CHECK (technical >= 0 AND technical <= 10),
  total_score numeric(5,2),
  comments text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(submission_id, judge_id)
);
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS uiux numeric(4,2);
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS total_score numeric(5,2);
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS comments text;
CREATE INDEX IF NOT EXISTS idx_scores_submission_id ON public.scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON public.scores(judge_id);
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read scores" ON public.scores;
DROP POLICY IF EXISTS "Allow authenticated insert scores" ON public.scores;
CREATE POLICY "Allow authenticated read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert scores" ON public.scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Food coupons
CREATE TABLE IF NOT EXISTS public.food_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.food_coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all food_coupons" ON public.food_coupons;
CREATE POLICY "Allow all food_coupons" ON public.food_coupons FOR ALL USING (true) WITH CHECK (true);

-- 7. QR scans
CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all qr_scans" ON public.qr_scans;
CREATE POLICY "Allow all qr_scans" ON public.qr_scans FOR ALL USING (true) WITH CHECK (true);
