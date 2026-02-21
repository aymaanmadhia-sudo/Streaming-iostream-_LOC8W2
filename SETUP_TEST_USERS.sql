-- ============================================================
-- HACKATHON360: Create Test Users & Profiles
-- Copy-paste this file into Supabase SQL Editor
-- DO NOT RUN before you have created auth.users via Supabase UI
-- ============================================================

-- STEP 1: Create student user in Supabase Dashboard
-- (Students can self-register via /auth/register, so you may skip this)
-- 
-- If you want to create a student manually:
-- 1. Go to Authentication → Users → Add user
-- 2. Email: student@test.com, Password: Test@123
-- 3. Then run this SQL (replace UUID with the ID from auth.users):
--
-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('STUDENT_UUID_FROM_AUTH', 'student@test.com', 'student')
-- ON CONFLICT (id) DO UPDATE SET role = 'student', updated_at = now();


-- STEP 2: Create judge user
--
-- HOW TO GET THE UUID:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click the "Add user" button
-- 3. Email: judge@test.com
-- 4. Password: Test@123
-- 5. Click "Create user"
-- 6. Copy the UUID that appears in the list
-- 7. Replace 'JUDGE_UUID_HERE' below with that UUID
-- 8. Run this query:

INSERT INTO public.profiles (id, email, role)
VALUES ('JUDGE_UUID_HERE', 'judge@test.com', 'judge')
ON CONFLICT (id) DO UPDATE SET
  email = 'judge@test.com',
  role = 'judge',
  updated_at = now();

-- Verify judge was created:
SELECT id, email, role FROM public.profiles WHERE email = 'judge@test.com';


-- STEP 3: Create admin user
--
-- HOW TO GET THE UUID:
-- Same as judge above - create user in Authentication → Users
-- Email: admin@test.com
-- Password: Test@123
-- Copy the UUID and replace 'ADMIN_UUID_HERE' below
-- Then run this query:

INSERT INTO public.profiles (id, email, role)
VALUES ('ADMIN_UUID_HERE', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET
  email = 'admin@test.com',
  role = 'admin',
  updated_at = now();

-- Verify admin was created:
SELECT id, email, role FROM public.profiles WHERE email = 'admin@test.com';


-- OPTIONAL: Verify all users and their roles
SELECT id, email, role, created_at FROM public.profiles ORDER BY created_at DESC;


-- OPTIONAL: Change a user's role (if needed)
-- Example: Change judge back to student
-- UPDATE public.profiles SET role = 'student', updated_at = now() WHERE email = 'judge@test.com';


-- OPTIONAL: Delete a user's profile (if you need to recreate)
-- Warning: This will remove their role, but auth.users will still exist
-- DELETE FROM public.profiles WHERE email = 'judge@test.com';
