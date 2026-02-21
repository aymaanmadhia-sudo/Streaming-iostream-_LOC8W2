# Admin/Judge Dashboard Not Accessible - Diagnosis & Fix

## Problem Summary
Admin and Judge dashboards redirect users back to login. Only student dashboard works. The root cause is **missing or incorrectly configured role data in `public.profiles`**.

---

## Step 1: Diagnose Your Database State

### Run this in Supabase SQL Editor to check what profiles exist:

```sql
-- Check all profiles and their roles
SELECT id, email, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Check if auth.users have corresponding profiles
SELECT au.id, au.email, COALESCE(p.role, '⚠️ NO PROFILE') as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
```

### What to look for:
- ✅ **GOOD**: Admin users have role = 'admin', Judge users have role = 'judge'
- ❌ **PROBLEM**: Profiles missing (NO PROFILE shows ⚠️)
- ❌ **PROBLEM**: Profiles exist but role = NULL
- ❌ **PROBLEM**: Profiles exist but role = 'student' when they should be 'admin'/'judge'

---

## Step 2: Fix Missing/Incorrect Roles

### Option A: If profile doesn't exist at all

Get the user ID from Supabase Auth > Users tab, then run:

```sql
-- CREATE profile for judge user (replace with actual UUID from auth.users)
INSERT INTO public.profiles (id, email, role)
VALUES ('YOUR-JUDGE-UUID-HERE', 'judge@example.com', 'judge')
ON CONFLICT (id) DO UPDATE SET role = 'judge';

-- CREATE profile for admin user (replace with actual UUID from auth.users)
INSERT INTO public.profiles (id, email, role)
VALUES ('YOUR-ADMIN-UUID-HERE', 'admin@example.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Option B: If profile exists but role is NULL or wrong

```sql
-- Fix judge's role
UPDATE public.profiles 
SET role = 'judge' 
WHERE id = 'YOUR-JUDGE-UUID-HERE';

-- Fix admin's role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR-ADMIN-UUID-HERE';

-- Verify it worked
SELECT id, email, role FROM public.profiles 
WHERE id IN ('YOUR-JUDGE-UUID-HERE', 'YOUR-ADMIN-UUID-HERE');
```

---

## Step 3: Verify the Fix in the App

After updating profiles:

1. **Open browser DevTools** (F12 → Console tab)
2. **Go to login page**: http://localhost:3000/auth/login
3. **Sign in** as the admin/judge user
4. **Check console logs** for messages like:
   - `[Login] User role: admin` ✅
   - `[Login] Redirecting to /admin` ✅
   - `[Admin] User ... with role 'admin' accessing /admin` ❌ (but dashboard shows)
5. **Access the dashboard** at http://localhost:3000/admin or http://localhost:3000/judge
6. **Check for messages showing**:
   - `[admin-page] ✅ User role found "admin"` ✅
   - `✓ admin-page: ALLOWED to access /admin` ✅

---

## Step 4: How the Flow Works (for reference)

```
User Logins 
  ↓
  → Login Page queries public.profiles for role
  ↓
  IF role found → Redirect to /admin, /judge, or /student
  IF role NOT found → Show error "Contact admin"
  ↓
  User navigates to dashboard (e.g., /admin)
  ↓
  → Page queries their role via fetchUserRole()
  ↓
  IF role matches page (admin for /admin) → Show dashboard ✅
  IF role doesn't match → Redirect to correct dashboard
```

### What roles route to what dashboards:

| User Role | Dashboard URL | Page |
|-----------|-------------|------|
| `admin` | `/admin` | Admin stats dashboard |
| `judge` | `/judge` | Judge evaluation panel |
| `student` | `/student` | Student submission panel |

---

## Step 5: Common Causes & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Can login but redirects to student | Profile role = 'student' or NULL | Update role in SQL |
| "Your profile has no role assigned" error | PUBLIC.PROFILES row missing role column | Check migration 003_profiles_role_auth.sql ran |
| Profile query error in console | RLS policy blocking read | Check RLS allows reading own profile |
| 403 Forbidden on dashboard | Not authenticated (no session) | Login first |

---

## Step 6: Emergency Reset (if all else fails)

If profiles are corrupted, delete and recreate:

```sql
-- DELETE all judge and admin profiles (CAREFUL!)
DELETE FROM public.profiles 
WHERE role IN ('judge', 'admin');

-- Now manually insert fresh ones with these exact UUIDs:
-- (You must get the UUIDs from Supabase Auth > Users tab first)

INSERT INTO public.profiles (id, email, role) VALUES
  ('JUDGE-UUID-FROM-AUTH-UI', 'judge@example.com', 'judge'),
  ('ADMIN-UUID-FROM-AUTH-UI', 'admin@example.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
```

---

## Debug Info: Enhanced Console Logging

The code now includes detailed console logs:

### In fetchUserRole() → When querying profile:
- ✅ `[middleware-protected] ✅ User role found: "admin"` → all good
- ❌ `[middleware-protected] ❌ PROFILE FETCH ERROR` → profile doesn't exist
- ❌ `[middleware-protected] ❌ Profile exists but role is NULL` → role column empty
- 🔧 `FIX: Run SETUP_TEST_USERS.sql or create profile...` → actionable help

### In middleware.ts → When checking route access:
- ✓ `[Middleware] ✓ admin verified: ALLOWED to access /admin`
- ✗ `[Middleware] ✗ User has role 'student': NOT allowed to access /admin → /student`

### In page components → When rendering dashboard:
- ✅ `[admin-page] ✅ Showing admin dashboard`
- ⚠️ `[admin-page] User with role 'student' accessing /admin - redirecting`

---

## Next Steps

1. **Run the diagnostic SQL** from Step 1
2. **Identify the problem** (missing profile, NULL role, or wrong role)
3. **Apply fix from Step 2** (insert or update)
4. **Test in browser** with DevTools console open
5. **Share console logs** if still having issues

All code changes are simple and non-breaking. No database schema changes needed.
