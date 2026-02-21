import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Hackathon360
        </h1>
        <p className="mt-3 text-slate-400">
          AI-Powered Hackathon Lifecycle – Submit projects, judge, and manage from one platform.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border border-slate-600 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Register
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-500">
          Students, judges, and admins use the same sign-in. You’ll be redirected to the right dashboard.
        </p>
      </div>
    </div>
  );
}
