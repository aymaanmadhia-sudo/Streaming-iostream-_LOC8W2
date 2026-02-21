-- Teams and team members tables for hackathon team submissions
-- Run in Supabase SQL Editor after 008_hackathon360_spec.sql

-- ========== teams table ==========
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  leader_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON public.teams(created_at DESC);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read teams; leader can insert/update own; service role can manage
DROP POLICY IF EXISTS "Anyone can read teams" ON public.teams;
CREATE POLICY "Anyone can read teams" ON public.teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leader can update own team" ON public.teams;
CREATE POLICY "Leader can update own team" ON public.teams FOR UPDATE USING (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Users can insert team as leader" ON public.teams;
CREATE POLICY "Users can insert team as leader" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Service role can manage teams" ON public.teams;
CREATE POLICY "Service role can manage teams" ON public.teams FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ========== team_members table ==========
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS: anyone can read team members; service role can manage all; team leader can insert/delete
DROP POLICY IF EXISTS "Anyone can read team members" ON public.team_members;
CREATE POLICY "Anyone can read team members" ON public.team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage team members" ON public.team_members;
CREATE POLICY "Service role can manage team members" ON public.team_members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Team leader can insert members" ON public.team_members;
CREATE POLICY "Team leader can insert members" ON public.team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid())
);

DROP POLICY IF EXISTS "Team leader can delete members" ON public.team_members;
CREATE POLICY "Team leader can delete members" ON public.team_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND leader_id = auth.uid())
);

-- ========== Add team_id to submissions ==========
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON public.submissions(team_id);

-- Allow one submission per (user_id OR team_id), not both at same time
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS check_submission_user_or_team;
ALTER TABLE public.submissions ADD CONSTRAINT check_submission_user_or_team
  CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  );

-- Update RLS for submissions to include team access
DROP POLICY IF EXISTS "Users can update own submission or team submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can read own or team submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can insert own or team submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can update own submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can read own submission" ON public.submissions;
DROP POLICY IF EXISTS "Users can insert own submission" ON public.submissions;
DROP POLICY IF EXISTS "Anyone authenticated can read all submissions (leaderboard)" ON public.submissions;

CREATE POLICY "Users can update own submission or team submission" ON public.submissions 
  FOR UPDATE USING (
    auth.uid() = user_id OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = submissions.team_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can read own or team submission" ON public.submissions 
  FOR SELECT USING (
    auth.uid() = user_id OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = submissions.team_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own or team submission" ON public.submissions 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM public.team_members 
      WHERE team_id = submissions.team_id
    )
  );

CREATE POLICY "Anyone authenticated can read all submissions (leaderboard)" ON public.submissions 
  FOR SELECT USING (auth.role() = 'authenticated');
