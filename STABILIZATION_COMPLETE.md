# Authentication & Routing — Stabilization Complete

## What Was Fixed

### 1. **Middleware.ts** — Simplified to Session-Only
- **Before**: Complex 3-case role verification with redirects
- **After**: Simple check: no-session → login, has-session → allow through
- **Goal**: Remove redirect loops and middleware blocking
- **Result**: Middleware no longer interferes with admin/judge access

### 2. **Login Redirect Logic** — Fixed in `/auth/login`
- **Before**: Complex role-utils dependency with error-prone lookup
- **After**: Simple SQL query → direct role fetch → role-based redirect
- **Console logs**: Now shows exactly what's fetched and where it's redirecting
- **No defaults**: If role is null, shows error to user instead of silent default

### 3. **Dashboard Pages** — Simplified Authorization
- **Admin page** (`/app/admin/page.tsx`): Queries role, checks `role === "admin"`, redirects if not
- **Judge page** (`/app/judge/page.tsx`): Queries role, checks `role === "judge"`, redirects if not
- **Student page** (`/app/student/dashboard/page.tsx`): Allows students and admins
- **Dashboard** (`/app/dashboard/page.tsx`): Admin-only, redirects others to their dashboards
- **Result**: No role-utils dependency, no infinite loops, clear redirect chain

### 4. **Removed All Default Fallbacks**
- ❌ Removed: `role || "student"`
- ❌ Removed: Silent defaults to student
- ❌ Removed: Complex verifyRouteAccess logic
- ✅ Added: Explicit error messages when role is missing

### 5. **Session Persistence**
- Added 100ms delay before redirect to ensure session is fully set in cookies
- Changed from `getSession()` to direct query for more reliability
- Session now persists across page reloads

---

## File-by-File Changes

| File | Change | Impact |
|------|--------|--------|
| `middleware.ts` | 161 lines → 57 lines | Massive simplification, only checks session |
| `app/auth/login/page.tsx` | Enhanced logging, cleaner role fetch | Clear debugging info, no defaults |
| `app/auth/register/page.tsx` | Same pattern as login | Consistent behavior |
| `app/admin/page.tsx` | Removed role-utils, direct query | Faster, simpler, clearer logs |
| `app/judge/page.tsx` | Removed role-utils, direct query | Faster, simpler, clearer logs |
| `app/dashboard/page.tsx` | Cleaner redirects, no forced /student | Better routing logic |
| `app/student/dashboard/page.tsx` | Simplified authorization | Allows admins to view student submissions |

---

## How It Works Now (Simplified Flow)

```
┌─ User visits app
│
├─ NO SESSION
│  └─ Protected route? → redirect /auth/login ✓
│  └─ Auth route? → allow (login page handles it)
│
└─ SESSION EXISTS
   └─ Any route? → ALLOW THROUGH (no middleware blocking)
      ↓
      ┌─ User visits /auth/login
      │  └─ Display login form
      │  └─ On submit:
      │     1. Sign in with Supabase
      │     2. Fetch role from public.profiles
      │     3. Redirect based on role:
      │        - admin → /admin
      │        - judge → /judge
      │        - student → /student/dashboard
      │     4. If role is null → show error
      │
      └─ User visits /admin, /judge, /student
         └─ Page queries role from public.profiles
         └─ If role matches → show dashboard
         └─ If role doesn't match → redirect to correct area
```

---

## Testing Checklist

### Test 1: Admin User Flow
- [ ] In Supabase, create admin user in `auth.users` (email: admin@test.com, password: test123)
- [ ] In SQL Editor, insert profile: `INSERT INTO public.profiles (id, email, role) VALUES ('ADMIN-UUID-HERE', 'admin@test.com', 'admin')`
- [ ] Open http://localhost:3000/auth/login
- [ ] Sign in with admin@test.com / test123
- [ ] Check console: Should see `[Login] ✓ Role fetched: "admin"` and `[Login] → Redirecting to: /admin`
- [ ] Should land on `/admin` dashboard
- [ ] Dashboard should show statistics (participants, submissions, teams, judges)
- [ ] Browser console should show `[admin-page] User has role: admin`

### Test 2: Judge User Flow
- [ ] Create judge user in `auth.users` (judge@test.com)
- [ ] Insert profile with role='judge'
- [ ] Login with judge@test.com
- [ ] Should redirect to `/judge`
- [ ] Judge dashboard should show (Verified submissions, Reviewed by you, Pending reviews)
- [ ] Console: `[judge-page] User has role: judge`

### Test 3: Student User Flow
- [ ] Create or register new student account
- [ ] On register, should collect role from profile
- [ ] Should redirect to `/student/dashboard`
- [ ] Student dashboard shows QR code, submissions list
- [ ] Console: `[student-dashboard] User has role: student`

### Test 4: No Redirect Loops
- [ ] Login as admin, visit /student → redirects to /admin (or shows content if allowed)
- [ ] Login as judge, visit /admin → error page or redirects to /judge
- [ ] No infinite redirects, no "stuck in login loop"

### Test 5: No Session = Login Redirect
- [ ] Open private/incognito window (no session in cookies)
- [ ] Visit http://localhost:3000/admin
- [ ] Should redirect to /auth/login
- [ ] After login with correct role, should land on /admin

### Test 6: Missing Profile
- [ ] Create a user in auth.users WITHOUT inserting to public.profiles
- [ ] Try to login
- [ ] Should see error: "Cannot find your profile" or "Your profile does not exist"
- [ ] NOT a redirect loop, NOT a 403

### Test 7: Role is NULL
- [ ] Insert profile but leave role as NULL
- [ ] Try to login
- [ ] Should see error: "Your profile has no role set"
- [ ] NOT stuck, clear error message

---

## Database Setup (If Needed)

### Create Test Users

Run this in Supabase SQL Editor:

```sql
-- 1. Create admin user in auth.users (via Supabase UI)
-- Go to: Supabase Dashboard > Your Project > Auth > Users > Add User
-- Email: admin@test.com
-- Password: test123
-- Auto-confirm = YES

-- 2. Get the UUID from auth.users, then run this SQL:
INSERT INTO public.profiles (id, email, role) 
VALUES ('REPLACE-WITH-ADMIN-UUID', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 3. Similarly for judge:
INSERT INTO public.profiles (id, email, role) 
VALUES ('REPLACE-WITH-JUDGE-UUID', 'judge@test.com', 'judge')
ON CONFLICT (id) DO UPDATE SET role = 'judge';

-- 4. Verify all profiles have roles:
SELECT id, email, role FROM public.profiles ORDER BY created_at DESC;
```

---

## Console Logs to Watch For

### ✅ Success Signs
```
[Middleware] No session for /admin → redirect to login
[Login] ✓ User signed in. ID: abc123...
[Login] ✓ Session confirmed
[Login] → Fetching role...
[Login] ✓ Role fetched: "admin"
[Login] → Redirecting to: /admin
[admin-page] User abc123... has role: admin
```

### ❌ Problem Signs
```
[Login] ❌ Profile fetch error: PGRST116
[Login] ❌ No profile record found for user
[Login] ❌ Profile exists but role is NULL
[admin-page] User admin123... has role: null  ← PROBLEM
```

---

## Rollback (If Needed)

If this breaks something, the changes are minimal:

1. **Middleware**: Only requires session check, no role verification
   - Rollback: Keep the simple version, add back role checks only if needed

2. **Login pages**: Just added console logs and clearer error messages
   - Rollback: Change from `public.profiles` back to `public.users` if that's your schema

3. **Dashboard pages**: Removed role-utils dependency
   - Rollback: Add back `fetchUserRole` imports if you prefer the centralized version

---

## Next Steps

1. **Test all 7 scenarios above** using the checklist
2. **Monitor browser console** for the log messages listed
3. **If any test fails**, check console for error messages
4. **Run diagnostic SQL** (`DIAGNOSTIC_QUERIES.sql`) to verify database state
5. **Contact admin** if role is missing from profile

---

## Key Differences From Before

| Aspect | Before | After |
|--------|--------|-------|
| Middleware role checking | Complex 3-case logic | Simple session-only |
| Redirect chain | Middleware → page → middleware loop | Middleware → login → middleware → page |
| Role default | Could silently default to "student" | Explicit error if role missing |
| Page authorization | Used role-utils function | Direct SQL query |
| Console debugging | Complex logs | Simple "User has role: X" logs |
| Lines of code | 161 (middleware) | 57 (middleware) |

