-- Hackathon360 spec: qr_logs, submission columns (github_stars, last_commit), scores presentation, status evaluated
-- Run in Supabase SQL Editor after 001-007.

-- ========== qr_logs (entry | food) ==========
CREATE TABLE IF NOT EXISTS public.qr_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entry', 'food')),
  timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qr_logs_user_id ON public.qr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_logs_type ON public.qr_logs(type);
CREATE INDEX IF NOT EXISTS idx_qr_logs_timestamp ON public.qr_logs(timestamp DESC);
ALTER TABLE public.qr_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own qr_logs" ON public.qr_logs;
CREATE POLICY "Users can insert own qr_logs" ON public.qr_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow read qr_logs for admin" ON public.qr_logs;
CREATE POLICY "Allow read qr_logs for admin" ON public.qr_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ========== submissions: github_stars, last_commit; status 'evaluated' ==========
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS github_stars integer;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS last_commit timestamptz;
-- Allow status 'evaluated' (drop and re-add check if needed)
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check1;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'submitted', 'under_review', 'scored', 'evaluated', 'draft'));

-- ========== scores: presentation column (0-10), total = innovation + technical + presentation ==========
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS presentation numeric(4,2) CHECK (presentation >= 0 AND presentation <= 10);
-- Ensure total/total_score exists (007 has total_score)
-- If scores use generated total, ensure presentation is used; else app computes total.
