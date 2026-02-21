import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminLeaderboardPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, title, user_id, student_id")
    .order("created_at", { ascending: false });

  const { data: scores } = await supabase
    .from("scores")
    .select("submission_id, total, total_score");

  const bySubmission: Record<string, { sum: number; count: number }> = {};
  for (const s of scores ?? []) {
    const id = s.submission_id;
    if (!bySubmission[id]) bySubmission[id] = { sum: 0, count: 0 };
    const total = Number((s as { total?: number; total_score?: number }).total ?? (s as { total_score?: number }).total_score ?? 0);
    bySubmission[id].sum += total;
    bySubmission[id].count += 1;
  }

  const userIds = [...new Set((submissions ?? []).map((s) => (s as { user_id?: string; student_id?: string }).user_id ?? (s as { student_id?: string }).student_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email").in("id", userIds)
    : { data: [] };
  const nameById = (profiles ?? []).reduce(
    (acc, p) => ({ ...acc, [p.id]: p.email }),
    {} as Record<string, string>
  );

  const ranked = (submissions ?? [])
    .map((s) => {
      const uid = (s as { user_id?: string; student_id?: string }).user_id ?? (s as { student_id?: string }).student_id;
      const sc = bySubmission[s.id] ?? { sum: 0, count: 0 };
      return {
        ...s,
        participant: nameById[uid ?? ""] ?? "—",
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
          Submissions ranked by total judge scores (from Supabase)
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Rank</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Project</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Participant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Total score</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Judges</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No scored submissions yet.
                  </td>
                </tr>
              ) : (
                ranked.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-bold text-slate-200">#{s.rank}</td>
                    <td className="px-4 py-3 font-medium text-white">{s.title}</td>
                    <td className="px-4 py-3 text-slate-400">{s.participant}</td>
                    <td className="px-4 py-3 text-slate-200">{s.totalScore}</td>
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
