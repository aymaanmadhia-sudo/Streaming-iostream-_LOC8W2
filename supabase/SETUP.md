# Supabase Setup

## Step 1: Run the SQL

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Go to **SQL Editor** → **New query**
3. Copy the **entire** contents of `RUN_THIS_IN_SUPABASE.sql`
4. Paste and click **Run**
5. Ignore any "already exists" errors — the script is idempotent

## Step 2: Fix your .env.local (CRITICAL for sign-in)

Your Supabase keys must be correct. **Wrong keys cause "sign problem" / login failures.**

1. Supabase Dashboard → **Project Settings** → **API**
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key (the long JWT) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The correct anon key is a **long JWT starting with `eyJ`** (e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...`).

If yours looks like `sb_publishable_...` it is **wrong** — that format is not Supabase. Get the correct key from API settings.

## Step 2b: Fix sign-in (if login still fails)

Run `FIX_SIGN_ISSUE.sql` in the SQL Editor. It will:
- Ensure `students` has an `email` column
- Create missing `profiles` for auth users (fixes "Profile not found")

Then set yourself as admin (replace email):
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Step 3: Create test users

### Admin (auth)
1. Authentication → Users → Add user
2. Email + password
3. After signup, run in SQL Editor:
```sql
INSERT INTO public.profiles (id, email, role)
VALUES ('USER_UUID_FROM_AUTH_USERS', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

### Judge (auth)
Same as admin, but use `role = 'judge'`.

### Student (anon)
Go to `/student/register` and register with name + email. No auth needed.

## Step 4: Run the app

```bash
npm run dev
```

- Auth sign-in/sign-up has been removed; use home `/` or student flow
- `/student/register` — Student registration
- `/student/submit` — Student project submission
- `/admin` — Admin dashboard (requires admin role)
- `/judge/evaluate` — Judge scoring (requires judge role)
- `/dashboard` — Full admin dashboard (requires admin role)
