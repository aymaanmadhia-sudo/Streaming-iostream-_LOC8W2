import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function DashboardOverviewPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;
  console.log(`[dashboard-page] User ${user.id.slice(0, 8)}... has role: ${userRole || 'NONE'}`);

  // Dashboard is admin-only overview. Others should use their specific dashboards.
  if (userRole !== "admin") {
    console.log(`[dashboard-page] User role '${userRole}' - redirecting to their specific dashboard`);
    // Redirect non-admins to their appropriate dashboard
    if (userRole === "judge") redirect("/judge");
    if (userRole === "student") redirect("/student/dashboard");
    // Unknown role - send to login
    redirect("/auth/login");
  }

  const [
    studentsRes,
    submissionsRes,
    pendingRes,
    approvedRes,
    scoresRes,
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("scores").select("total_score"),
  ]);

  const totalStudents = studentsRes.count ?? 0;
  const totalSubmissions = submissionsRes.count ?? 0;
  const pendingSubmissions = pendingRes.count ?? 0;
  const approvedSubmissions = approvedRes.count ?? 0;

  const scores = scoresRes.data ?? [];
  const avgScore =
    scores.length > 0
      ? (scores.reduce((s, r) => s + Number(r.total_score ?? 0), 0) / scores.length).toFixed(1)
      : "—";

  const statCards = [
    { label: "Participants", value: totalStudents, icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Total Submissions", value: totalSubmissions, icon: "📤", color: "from-cyan-500 to-cyan-600" },
    { label: "Pending Review", value: pendingSubmissions, icon: "⏳", color: "from-amber-500 to-amber-600" },
    { label: "Approved", value: approvedSubmissions, icon: "✓", color: "from-emerald-500 to-emerald-600" },
    { label: "Avg Judge Score", value: avgScore, icon: "⭐", color: "from-rose-500 to-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">Real-time hackathon metrics from Supabase</p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Admin dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur transition hover:border-slate-700 hover:bg-slate-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${card.color} animate-pulse`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-white tabular-nums">{card.value}</p>
            <p className="text-xs text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">Quick links</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/submissions"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Review submissions
          </Link>
          <Link
            href="/dashboard/participants"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Participants
          </Link>
          <Link
            href="/dashboard/submissions"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            All submissions
          </Link>
          <Link
            href="/dashboard/leaderboard"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
