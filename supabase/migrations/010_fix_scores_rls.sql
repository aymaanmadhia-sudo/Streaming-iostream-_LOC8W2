-- Fix scores table RLS policies for proper judge access
-- Ensure only judges can insert scores, and proper role-based read access

-- Add presentation column if missing (from 008_hackathon360_spec.sql)
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS presentation int CHECK (presentation >= 0 AND presentation <= 10);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated read scores" ON public.scores;
DROP POLICY IF EXISTS "Allow authenticated insert scores" ON public.scores;

-- Admin: can read all scores
CREATE POLICY "Admin can read all scores" ON public.scores 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Judge: can read and insert scores
CREATE POLICY "Judge can read scores" ON public.scores 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'judge')
  );

CREATE POLICY "Judge can insert scores" ON public.scores 
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'judge')
    AND auth.uid() = judge_id
  );

-- Students: read own scores if they submitted the submission
CREATE POLICY "Student can read own submission scores" ON public.scores
  FOR SELECT USING (
    submission_id IN (
      SELECT id FROM public.submissions 
      WHERE user_id = auth.uid() OR 
            (team_id IS NOT NULL AND team_id IN (
              SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
            ))
    )
  );
