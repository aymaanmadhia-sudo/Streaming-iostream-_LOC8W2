import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function JudgePanelPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: subs } = await supabase
    .from("submissions")
    .select("id, title, student_id")
    .eq("status", "approved");

  const { data: scores } = await supabase
    .from("scores")
    .select("submission_id, total_score");

  const submissions = subs ?? [];
  const bySubmission: Record<string, { sum: number; count: number }> = {};
  for (const s of scores ?? []) {
    const id = s.submission_id;
    if (!bySubmission[id]) bySubmission[id] = { sum: 0, count: 0 };
    bySubmission[id].sum += Number(s.total_score ?? 0);
    bySubmission[id].count += 1;
  }

  const studentIds = [...new Set(submissions.map((s) => s.student_id).filter(Boolean))];
  const { data: students } = studentIds.length
    ? await supabase.from("students").select("id, name").in("id", studentIds)
    : { data: [] };
  const nameById = (students ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s.name }),
    {} as Record<string, string>
  );

  const leaderboard = submissions
    .map((s) => {
      const sc = bySubmission[s.id] ?? { sum: 0, count: 0 };
      return {
        ...s,
        team: nameById[s.student_id] ?? "—",
        avg: sc.count > 0 ? Math.round((sc.sum / sc.count) * 10) / 10 : null,
        total: sc.sum,
        judges: sc.count,
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, rank: i + 1 }))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Judge Panel</h2>
          <p className="mt-1 text-sm text-slate-400">
            Leaderboard from real scores. Judges score at /judge/evaluate.
          </p>
        </div>
        <Link
          href="/judge/evaluate"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white hover:from-blue-500 hover:to-cyan-500"
        >
          Judge evaluate →
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">Live leaderboard (from Supabase)</h3>
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <p className="text-slate-500">No scored submissions yet. Approve submissions first, then have judges score at /judge/evaluate.</p>
          ) : (
            leaderboard.map((row) => (
              <div
                key={row.id}
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  row.rank <= 3 ? "bg-slate-800/80 ring-1 ring-slate-600" : "bg-slate-800/40"
                }`}
              >
                <span className="w-6 font-bold text-slate-400">#{row.rank}</span>
                <span className="flex-1 font-medium text-slate-200">{row.title}</span>
                <span className="text-slate-300">{row.team}</span>
                <span className="ml-4 text-slate-300 text-sm">
                  Avg {row.avg ?? "—"}
                </span>
                <span className="ml-4 text-slate-400 text-xs">{row.judges} judges</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
