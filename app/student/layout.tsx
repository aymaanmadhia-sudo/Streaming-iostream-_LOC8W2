import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/student"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Hackathon360
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/student"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/student/team"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Team
            </Link>
            <Link
              href="/student/submit"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Submit Project
            </Link>
            <Link
              href="/student/leaderboard"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Leaderboard
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
