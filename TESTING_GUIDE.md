# Quick Start Testing Guide

## Before You Start

**Prerequisites**:
1. Supabase project is set up
2. Migrations are applied
3. Database has public.profiles table with role column
4. `npm run dev` is running

---

## Test 1: Admin User Flows ✅

### Step 1.1: Create Admin User in Supabase

Go to: **Supabase Dashboard → Your Project → Auth → Users → Add User**

```
Email: admin@test.com
Password: Test@123456
Auto Confirm: YES (toggle on)
```

### Step 1.2: Create Profile in Database

Go to: **Supabase Dashboard → SQL Editor**

Run:
```sql
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Step 1.3: Test Login

1. Open http://localhost:3000/auth/login
2. Open DevTools: **F12 → Console tab**
3. Sign in with: **admin@test.com / Test@123456**
4. **Watch console for**:
   ```
   [Login] ✓ User signed in. ID: ...
   [Login] ✓ Session confirmed
   [Login] → Fetching role...
   [Login] ✓ Role fetched: "admin"
   [Login] → Redirecting to: /admin
   ```
5. Should land on: **http://localhost:3000/admin**
6. Dashboard should show: **4 stat cards** (participants, submissions, teams, judges)

✅ **SUCCESS** if:
- No errors in console
- Lands on /admin automatically
- See stat cards

❌ **FAIL** if:
- Redirect loop to login
- "Cannot find your profile" error
- "Your profile has no role set" error

---

## Test 2: Judge User Flow ✅

### Step 2.1: Create Judge User

**Supabase UI → Add User**:
```
Email: judge@test.com
Password: Test@123456
Auto Confirm: YES
```

### Step 2.2: Create Judge Profile

**SQL Editor**:
```sql
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'judge'
FROM auth.users
WHERE email = 'judge@test.com'
ON CONFLICT (id) DO UPDATE SET role = 'judge';
```

### Step 2.3: Test Judge Login

1. Logout (or private/incognito window)
2. Go to http://localhost:3000/auth/login
3. F12 → Console
4. Sign in: **judge@test.com / Test@123456**
5. **Expect console**:
   ```
   [Login] ✓ User signed in...
   [Login] ✓ Role fetched: "judge"
   [Login] → Redirecting to: /judge
   ```
6. Should land on: **http://localhost:3000/judge**
7. Should see: **3 stat cards** (Verified submissions, Reviewed by you, Pending your review)

✅ **SUCCESS** if:
- Redirects to /judge, not /admin or /student
- Shows judge-specific dashboard

❌ **FAIL** if:
- Profile error messages
- Redirects to wrong dashboard

---

## Test 3: Student User Flow ✅

### Step 3.1: Register as Student

1. Go to http://localhost:3000/auth/register
2. Enter:
```
Email: student@test.com
Password: Test@123456
```
3. Click "Create account"
4. F12 → Console
5. **Check for**:
   ```
   [Register] ✓ User created...
   [Register] ✓ Role assigned: "student"
   [Register] → Redirecting to: /student/dashboard
   ```
6. Should land on: **http://localhost:3000/student/dashboard**
7. Should see: **QR code** + submissions list

✅ **SUCCESS** if:
- Auto-creates profile with role='student'
- Shows student dashboard with QR code

---

## Test 4: Check No Redirect Loops

### Step 4.1: No Session Test

1. Open **private/incognito window** (no cookies)
2. Try to visit: http://localhost:3000/admin
3. Should redirect to: http://localhost:3000/auth/login (NOT loop)
4. After successful login, should land on: /admin (NOT loop back to login)

✅ **SUCCESS**: Redirect happens once, then stays on dashboard

---

## Test 5: Missing Profile Error

### Step 5.1: Create User WITHOUT Profile

1. Create user in Supabase but DON'T insert into profiles
2. Try to login with that user
3. F12 → Console
4. **Expect error message**:
   ```
   [Login] ❌ Profile fetch error
   Display: "Cannot find your profile. Contact admin."
   ```

✅ **SUCCESS**: Clear error, user can't login (not redirected silently)

---

## Test 6: NULL Role Error

### Step 6.1: Insert Profile with NULL Role

**SQL**:
```sql
INSERT INTO public.profiles (id, email, role)
VALUES ('some-uuid', 'test@example.com', NULL);
```

### Step 6.2: Try Login

1. Create auth user with that email
2. Try to login
3. **Expect error**:
   ```
   [Login] ❌ Profile exists but role is NULL
   Display: "Your profile has no role set. Contact admin."
   ```

✅ **SUCCESS**: Clear error message

---

## Test 7: Role-Based Access

### Step 7.1: Admin Visits /judge

1. Login as admin
2. Try to visit: http://localhost:3000/judge
3. **Check console**:
   ```
   [judge-page] User ... has role: admin
   ```
4. Should show judge dashboard (or redirect depending on implementation)

### Step 7.2: Judge Visits /admin  

1. Login as judge
2. Try to visit: http://localhost:3000/admin
3. **Check console**:
   ```
   [admin-page] User with role 'judge' tried to access /admin
   ```
4. Should redirect or show error

✅ **SUCCESS**: Proper role-based access control

---

## Test 8: Session Persistence

### Step 8.1: Login and Navigate

1. Login as any user
2. Click around different pages
3. Refresh page (Cmd+R or Ctrl+R)
4. **Should NOT redirect to login**

✅ **SUCCESS**: Session persists without re-login

---

## 🔥 All Tests Pass Checklist

- [ ] Admin login works → /admin
- [ ] Judge login works → /judge
- [ ] Student register works → /student/dashboard
- [ ] No redirect loops
- [ ] No session = redirects once to login
- [ ] Missing profile = clear error
- [ ] NULL role = clear error
- [ ] Role-based access works
- [ ] Session persists on refresh

---

## 📊 Console Log Cheat Sheet

| Log | Meaning | Action |
|-----|---------|--------|
| `[Middleware] No session...` | User not authenticated | ✅ Expected |
| `[Login] ✓ User signed in` | Auth successful | ✅ Good |
| `[Login] ✓ Role fetched: "admin"` | Profile found with role | ✅ Good |
| `[Login] → Redirecting to: /admin` | About to send user to dashboard | ✅ Good |
| `[Login] ❌ Profile fetch error` | Database query failed | ❌ Check profiles table |
| `[Login] ❌ No profile found` | User not in profiles table | ❌ Insert profile |
| `[Login] ❌ Role is NULL` | Profile exists but role is empty | ❌ Update role |
| `[admin-page] ... has role: admin` | Page loaded for correct role | ✅ Good |
| `[admin-page] ... tried to access /admin` | Wrong role tried dashboard | ✅ Redirect happens |

---

## 🆘 Quick Fixes

### "Cannot find your profile"

**SQL Fix**:
```sql
INSERT INTO public.profiles (id, email, role)
VALUES ('YOUR-USER-UUID', 'your-email@example.com', 'admin');
```

**To find user UUID**, go to Supabase → Auth → Users → click user

### "Your profile has no role set"

**SQL Fix**:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Stuck in Redirect Loop

1. Check middleware.ts uses simple session-only logic
2. Check login page correctly fetches role
3. Check dashboard pages check role before showing content
4. Open private window and test

---

## 🎯 Expected Results

**✅ ADMIN**
- Emails: admin@test.com
- Dashboard: /admin
- Sees: Participant count, submission count, team count, judge count

**✅ JUDGE**
- Email: judge@test.com  
- Dashboard: /judge
- Sees: Verified submissions, reviewed count, pending count

**✅ STUDENT**
- Email: student@test.com (self-registered)
- Dashboard: /student/dashboard
- Sees: QR code, submissions list

**✅ NO SESSION**
- Visiting /admin → redirected to login once
- After login → stays on dashboard

---

**ALL TESTS PASS = System Stable ✅**
