import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminPage() {
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
  console.log(`[admin-page] User ${user.id.slice(0, 8)}... has role: ${userRole || 'NONE'}`);

  // Admin-only page
  if (userRole !== "admin") {
    console.warn(`[admin-page] User with role '${userRole}' tried to access /admin - redirecting`);
    redirect("/dashboard");
  }

  const [participantsRes, submissionsRes, judgesRes, teamsRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "judge"),
    supabase.from("teams").select("*", { count: "exact", head: true }),
  ]);

  const totalParticipants = participantsRes.count ?? 0;
  const totalSubmissions = submissionsRes.count ?? 0;
  const totalJudges = judgesRes.count ?? 0;
  const totalTeams = teamsRes.count ?? 0;

  const cards = [
    { label: "Total participants", value: totalParticipants },
    { label: "Total submissions", value: totalSubmissions },
    { label: "Total teams", value: totalTeams },
    { label: "Total judges", value: totalJudges },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
      <p className="text-slate-400">Real-time stats from Supabase. No mock data.</p>
      <div className="grid gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/leaderboard"
          className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Leaderboard
        </Link>
        <Link
          href="/admin/submissions"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Submissions
        </Link>
        <Link
          href="/admin/teams"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Teams
        </Link>
        <Link
          href="/admin/logs"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          QR logs
        </Link>
      </div>
    </div>
  );
}
