import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminMonitorPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const [
    studentsRes,
    submissionsRes,
    pendingRes,
    approvedRes,
    scoresRes,
    qrRes,
    couponsRes,
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("scores").select("total_score"),
    supabase.from("qr_scans").select("*", { count: "exact", head: true }),
    supabase.from("food_coupons").select("*", { count: "exact", head: true }).not("used_at", "is", null),
  ]);

  const participants = studentsRes.count ?? 0;
  const totalSubmissions = submissionsRes.count ?? 0;
  const pending = pendingRes.count ?? 0;
  const approved = approvedRes.count ?? 0;
  const scores = scoresRes.data ?? [];
  const avgScore =
    scores.length > 0
      ? (scores.reduce((s, r) => s + Number(r.total_score ?? 0), 0) / scores.length).toFixed(1)
      : "—";
  const qrScans = qrRes.error ? 0 : (qrRes.count ?? 0);
  const foodUsed = couponsRes.error ? 0 : (couponsRes.count ?? 0);

  const statCards = [
    { label: "Participants", value: participants, icon: "👥", color: "from-blue-500 to-blue-600" },
    { label: "Total Submissions", value: totalSubmissions, icon: "📤", color: "from-cyan-500 to-cyan-600" },
    { label: "Pending Review", value: pending, icon: "⏳", color: "from-amber-500 to-amber-600" },
    { label: "Approved", value: approved, icon: "✓", color: "from-emerald-500 to-emerald-600" },
    { label: "QR Scans", value: qrScans, icon: "📋", color: "from-violet-500 to-violet-600" },
    { label: "Avg Score", value: avgScore, icon: "⭐", color: "from-rose-500 to-rose-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Monitor</h2>
        <p className="mt-1 text-sm text-slate-500">Real-time metrics from Supabase</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${card.color} animate-pulse`} />
            </div>
            <p className="mt-2 tabular-nums text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/submissions"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Review submissions
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Full dashboard →
        </Link>
      </div>
    </div>
  );
}
