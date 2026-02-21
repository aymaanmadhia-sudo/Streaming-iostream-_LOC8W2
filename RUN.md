# Hackathon360 – How to Run

Production-ready Hackathon360: Next.js 14 (App Router, TypeScript, Tailwind), Supabase (Auth + PostgreSQL), role-based dashboards (student, judge, admin). All data from Supabase; no mock data.

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Environment variables

Create `.env.local` in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (recommended for production):

- `SUPABASE_SERVICE_ROLE_KEY` – for admin/leaderboard operations that bypass RLS.
- `GITHUB_TOKEN` – for higher GitHub API rate limits when submitting projects (stargazers_count, pushed_at).
- `NEXT_PUBLIC_APP_URL` – base URL for QR links (e.g. `https://your-domain.com`). Defaults to `http://localhost:3000` in dev.

---

## 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run migrations in order:
   - `supabase/migrations/001_hackathon360_schema.sql` – users/submissions/scores (or your base schema).
   - `supabase/migrations/003_profiles_role_auth.sql` – profiles table + trigger (id, email, role).
   - `supabase/migrations/008_hackathon360_spec.sql` – qr_logs, submission columns (github_stars, last_commit), scores presentation, status evaluated.

   If you already have different migrations (e.g. 002, 005, 006, 007), run 008 after them so qr_logs and new columns exist.

3. In **Authentication → Providers**: enable Email and set a site URL (e.g. `http://localhost:3000`).
4. In **Settings → API**: copy Project URL and anon key into `.env.local`. Copy service role key if you use admin/leaderboard features.

---

## 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Sign in** / **Register** use Supabase Auth (email/password). On signup, the trigger inserts a row into `profiles` with `role = 'student'` (or from metadata). After login, you are redirected by role:
  - **student** → `/student`
  - **judge** → `/judge`
  - **admin** → `/admin`

To create judge or admin users, set `role` in `profiles` manually in Supabase (or via metadata on signup if you extend the flow).

---

## 5. Routes overview

| Route | Who | Description |
|-------|-----|-------------|
| `/` | Public | Landing; Sign in / Register links |
| `/auth/login` | Public | Email/password login → redirect by role |
| `/auth/register` | Public | Sign up (default role: student) |
| `/student` | Student | Redirects to dashboard |
| `/student/dashboard` | Student | Submission history, personal QR, Mark Entry / Mark Food |
| `/student/submit` | Student | Submit project (GitHub URL → stars + last commit stored) |
| `/student/leaderboard` | Student | Live leaderboard from Supabase |
| `/judge` | Judge | Dashboard; link to Evaluate |
| `/judge/evaluate` | Judge | List verified submissions; score innovation / technical / presentation (0–10); status → evaluated |
| `/admin` | Admin | Total participants, submissions, judges |
| `/admin/leaderboard` | Admin | Leaderboard (aggregate scores per submission) |
| `/admin/logs` | Admin | QR logs (entry & food) |
| `/admin/submissions` | Admin | Submissions management |

---

## 6. Build for production

```bash
npm run build
npm run start
```

Use the same env vars in your hosting (Vercel, etc.) and set the Supabase site URL to your production URL.

---

## 7. Security

- Middleware protects `/student`, `/judge`, `/admin` by Supabase Auth and `profiles.role`.
- Unauthenticated users are redirected to `/auth/login`.
- Students can only access `/student/*`; judges `/judge/*`; admins `/admin/*`.

No fake or static data: dashboards and leaderboard read from Supabase only.
