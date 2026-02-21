-- ============================================
-- HACKATHON360: Diagnostic Queries
-- ============================================
-- Run these queries in Supabase SQL Editor to diagnose profile/role issues

-- Query 1: See ALL profiles and their roles
SELECT 
  id, 
  email, 
  role, 
  created_at,
  CASE 
    WHEN role IS NULL THEN '⚠️ ROLE IS NULL'
    WHEN role = 'student' THEN '📚 STUDENT'
    WHEN role = 'judge' THEN '⭐ JUDGE'
    WHEN role = 'admin' THEN '👑 ADMIN'
    ELSE '❓ UNKNOWN: ' || role
  END as status
FROM public.profiles 
ORDER BY created_at DESC;


-- Query 2: Check if auth.users have matching profiles
SELECT 
  au.id as user_id,
  au.email,
  COALESCE(p.role, '❌ NO PROFILE') as profile_role,
  CASE 
    WHEN p.role IS NULL THEN 'MISSING'
    WHEN p.role = au.raw_user_meta_data->>'role' THEN 'SYNCED ✓'
    ELSE 'MISMATCH ⚠️'
  END as sync_status,
  au.raw_user_meta_data->>'role' as auth_metadata_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;


-- Query 3: Show admin and judge users specifically
SELECT 
  'admin' as requested_role,
  id,
  email,
  role as actual_role,
  CASE WHEN role = 'admin' THEN '✅ CORRECT' ELSE '❌ INCORRECT' END as status
FROM public.profiles
WHERE role = 'admin'

UNION ALL

SELECT 
  'judge' as requested_role,
  id,
  email,
  role as actual_role,
  CASE WHEN role = 'judge' THEN '✅ CORRECT' ELSE '❌ INCORRECT' END as status
FROM public.profiles
WHERE role = 'judge'

ORDER BY requested_role;


-- Query 4: Count by role
SELECT 
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;


-- ============================================
-- IF YOU NEED TO FIX ROLES (Copy-paste below)
-- ============================================

-- FIX #1: Set a specific user to admin (replace UUID)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'YOUR-UUID-HERE';


-- FIX #2: Set a specific user to judge (replace UUID)
-- UPDATE public.profiles 
-- SET role = 'judge' 
-- WHERE id = 'YOUR-UUID-HERE';


-- FIX #3: Create missing profile for judge (replace UUID and email)
-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('JUDGE-UUID-HERE', 'judge@example.com', 'judge')
-- ON CONFLICT (id) DO UPDATE SET role = 'judge';


-- FIX #4: Create missing profile for admin (replace UUID and email)
-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('ADMIN-UUID-HERE', 'admin@example.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
