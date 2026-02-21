import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/admin"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Hackathon360 · Admin
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/submissions"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Submissions
            </Link>
            <Link
              href="/admin/leaderboard"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Leaderboard
            </Link>
            <Link
              href="/admin/logs"
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              QR logs
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
