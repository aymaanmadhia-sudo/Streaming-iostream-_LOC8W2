-- Align schema for admin/judge: submissions status + demo_url, scores for judge panel
-- Run in Supabase SQL Editor.

-- Submissions: add status (pending|approved|rejected), demo_url, github_verified_at if missing
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS demo_url text;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS github_verified_at timestamptz;

-- Ensure status check; allow pending, approved, rejected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'submissions' AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE public.submissions
      DROP CONSTRAINT IF EXISTS submissions_status_check;
    ALTER TABLE public.submissions
      ADD CONSTRAINT submissions_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if constraint exists with different name
END $$;

-- Scores: support judge panel (innovation, uiux, technical, total_score, comments)
-- If scores has impact/feasibility from 001, add uiux and comments. Make impact/feasibility nullable for compatibility.
DO $$
BEGIN
  ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS uiux numeric(4,2);
  ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS total_score numeric(5,2);
  ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS comments text;
  -- Make old columns nullable so judge insert works (judge sends innovation, uiux, technical only)
  BEGIN
    ALTER TABLE public.scores ALTER COLUMN impact DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.scores ALTER COLUMN feasibility DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;
END $$;
