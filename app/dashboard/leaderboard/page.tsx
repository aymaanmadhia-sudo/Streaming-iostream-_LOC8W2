import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function LeaderboardPage() {
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

  const ranked = submissions
    .map((s) => {
      const sc = bySubmission[s.id] ?? { sum: 0, count: 0 };
      return {
        ...s,
        name: nameById[s.student_id] ?? "—",
        totalScore: sc.sum,
        judgesCount: sc.count,
        avgScore: sc.count > 0 ? Math.round((sc.sum / sc.count) * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Approved submissions ranked by judge scores (from Supabase)
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Team</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Avg score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Judges</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No scored submissions yet. Approve submissions and have judges score them.
                  </td>
                </tr>
              ) : (
                ranked.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-slate-200">#{s.rank}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{s.title}</td>
                    <td className="px-4 py-3 text-slate-400">{s.name}</td>
                    <td className="px-4 py-3 text-slate-200">{s.avgScore ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{s.judgesCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
