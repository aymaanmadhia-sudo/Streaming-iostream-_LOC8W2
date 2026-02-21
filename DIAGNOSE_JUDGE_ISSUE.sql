-- ============================================================
-- DIAGNOSTIC: Check why judge panel isn't showing
-- Run this in Supabase SQL Editor to diagnose the issue
-- ============================================================

-- 1. Check if judge profile exists
SELECT 'JUDGE PROFILES' as check_name, COUNT(*) as count, 
       STRING_AGG(id::text || ' - ' || email || ' (' || role || ')', ', ') as details
FROM public.profiles 
WHERE role = 'judge';

-- 2. Check if there are ANY profiles at all
SELECT 'ALL PROFILES' as check_name, COUNT(*) as count,
       STRING_AGG(id::text || ' - ' || email || ' (' || role || ')', ', ') as details
FROM public.profiles;

-- 3. Check auth.users (all authenticated users)
SELECT 'AUTH USERS' as check_name, COUNT(*) as count,
       STRING_AGG(email, ', ') as emails
FROM auth.users;

-- 4. Detailed check: Compare auth.users with profiles
SELECT 
  'SYNC CHECK' as check_name,
  au.email as auth_email,
  COALESCE(p.role, 'MISSING') as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 5. If you want to fix: Create judge profile for a specific user
-- UNCOMMENT and MODIFY THIS:
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'judge' FROM auth.users WHERE email = 'judge@test.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'judge', email = 'judge@test.com', updated_at = now();
