-- Ensure profiles.updated_at exists (fixes "could not find updated_at column" / schema cache)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
