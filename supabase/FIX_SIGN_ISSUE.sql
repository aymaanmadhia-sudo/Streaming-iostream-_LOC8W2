-- Run this in Supabase SQL Editor to fix sign-in problems

-- 1. Ensure students table has email column (required for register/login)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- 2. Ensure profiles exist for ALL auth users (fixes "Profile not found")
INSERT INTO public.profiles (id, email, role)
SELECT id, email, COALESCE(
  (raw_user_meta_data->>'role')::text,
  'student'
)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow users to insert/update their own profile (for login auto-fix)
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Set yourself as admin (replace with your email, then run this line)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
