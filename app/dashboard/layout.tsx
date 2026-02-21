"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";


const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/participants", label: "Participants" },
  { href: "/dashboard/submissions", label: "Submissions" },
  { href: "/dashboard/github-check", label: "GitHub Authenticity Check" },
  { href: "/dashboard/ai-feedback", label: "AI PPT Feedback" },
  { href: "/dashboard/qr-attendance", label: "QR Attendance" },
  { href: "/dashboard/food-coupon", label: "Food Coupon Control" },
  { href: "/dashboard/judge", label: "Judge Panel" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/admin", label: "Admin Command Center" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur transition-all duration-300 lg:static ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Hackathon360
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs">
                  {item.label.charAt(0)}
                </span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6">
          <h1 className="text-lg font-semibold text-slate-200">
            AI-Powered Hackathon Lifecycle Platform
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">Admin</span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
