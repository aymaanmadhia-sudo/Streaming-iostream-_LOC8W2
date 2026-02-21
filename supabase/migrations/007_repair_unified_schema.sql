-- REPAIR: Unified schema so the app works regardless of which migrations ran first.
-- Run this in Supabase SQL Editor AFTER 001-006. Fixes conflicts and RLS.

-- ========== 1. SUBMISSIONS: Ensure student_id + status exist ==========
-- If 001 ran first, submissions has user_id only. Add student_id.
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;
-- Make user_id nullable if it exists (001 had it NOT NULL; student flow uses student_id)
DO $$ BEGIN
  ALTER TABLE public.submissions ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Add missing columns
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS demo_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS github_verified_at timestamptz;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Set default status for existing rows
UPDATE public.submissions SET status = 'pending' WHERE status IS NULL;
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.submissions ALTER COLUMN status SET NOT NULL;

-- Drop old status constraints and add our enum
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check1;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Allow at least one of user_id or student_id for inserts (for compatibility)
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_user_id_key;

-- ========== 2. RLS: Submissions - allow anon insert (student) + authenticated read/update ==========
DROP POLICY IF EXISTS "Users can insert own submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can read own submission" ON public.submissions;
DROP POLICY IF EXISTS "Anyone authenticated can read all submissions (leaderboard)" ON public.submissions;
DROP POLICY IF EXISTS "Allow insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow select submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow anon insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow authenticated select submissions" ON public.submissions;
DROP POLICY IF EXISTS "Allow admin update submissions" ON public.submissions;

CREATE POLICY "Allow insert submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow update submissions" ON public.submissions FOR UPDATE USING (
  auth.role() = 'authenticated' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========== 3. SCORES: Add uiux, total_score, comments ==========
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS uiux numeric(4,2);
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS total_score numeric(5,2);
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS comments text;

-- Make impact/feasibility nullable (001 had them NOT NULL; judge sends innovation, uiux, technical)
DO $$
BEGIN
  ALTER TABLE public.scores ALTER COLUMN impact DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE public.scores ALTER COLUMN feasibility DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- Judge insert: allow authenticated users (app checks judge role in API)
DROP POLICY IF EXISTS "Anyone authenticated can read scores" ON public.scores;
DROP POLICY IF EXISTS "Service role can insert scores" ON public.scores;
DROP POLICY IF EXISTS "Allow authenticated insert scores" ON public.scores;
DROP POLICY IF EXISTS "Allow authenticated read scores" ON public.scores;

CREATE POLICY "Allow authenticated read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert scores" ON public.scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========== 4. FOOD_COUPONS / QR_SCANS: Ensure tables exist with RLS ==========
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

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all qr_scans" ON public.qr_scans;
CREATE POLICY "Allow all qr_scans" ON public.qr_scans FOR ALL USING (true) WITH CHECK (true);
