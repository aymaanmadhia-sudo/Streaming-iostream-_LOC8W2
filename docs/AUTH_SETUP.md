# Hackathon360 – Auth setup (fix "Invalid login credentials")

## Why sign-in fails after register

Supabase can require **email confirmation** before a user can sign in. When that’s enabled:

- After **Register**, the user is created but has no session.
- **Sign in** returns **"Invalid login credentials"** until they click the link in the confirmation email.

## Fix: allow sign-in right after register

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Providers** → **Email**.
3. Find **"Confirm email"** and turn it **OFF**.
4. Save.

After this, new users get a session as soon as they register and are redirected to their dashboard. They don’t need to use the login page right after registering.

## If you keep "Confirm email" ON

- User must open the confirmation email and click the link.
- Optionally use **"Resend confirmation email"** on the login page (shown when you get invalid credentials) to send a new link.
- After confirming, sign in with the same email and password.

## Check environment variables

In `.env.local` you must have:

- `NEXT_PUBLIC_SUPABASE_URL` – your project URL (e.g. `https://xxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – the anon/public key from Project Settings → API

Restart the dev server (`npm run dev`) after changing `.env.local`.
