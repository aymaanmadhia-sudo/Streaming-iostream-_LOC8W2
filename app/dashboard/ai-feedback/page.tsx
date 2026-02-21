import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AIFeedbackPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: scores } = await supabase
    .from("scores")
    .select("id, submission_id, innovation, uiux, technical, total_score, comments")
    .order("created_at", { ascending: false })
    .limit(20);

  const list = (scores ?? []) as { id: string; submission_id: string; innovation?: number; uiux?: number; technical?: number; total_score?: number; comments?: string }[];
  const submissionIds = [...new Set(list.map((s) => s.submission_id))];
  const { data: subs } = submissionIds.length
    ? await supabase.from("submissions").select("id, title").in("id", submissionIds)
    : { data: [] };
  const titleById = (subs ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s.title }),
    {} as Record<string, string>
  );

  const hasUiux = list.some((s) => s.uiux != null);
  const avgInnovation = list.length ? list.reduce((s, r) => s + Number(r.innovation ?? 0), 0) / list.length : 0;
  const avgUiux = hasUiux && list.length ? list.reduce((s, r) => s + Number(r.uiux ?? 0), 0) / list.length : null;
  const avgTechnical = list.length ? list.reduce((s, r) => s + Number(r.technical ?? 0), 0) / list.length : 0;
  const avgTotal = list.length ? list.reduce((s, r) => s + Number(r.total_score ?? 0), 0) / list.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Judge Feedback Summary</h2>
        <p className="mt-1 text-sm text-slate-400">
          Aggregated scores and comments from judges (real Supabase data)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Avg Innovation</p>
          <p className="text-2xl font-bold text-white">{avgInnovation.toFixed(1)}</p>
        </div>
        {avgUiux != null && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500">Avg UI/UX</p>
            <p className="text-2xl font-bold text-white">{avgUiux.toFixed(1)}</p>
          </div>
        )}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Avg Technical</p>
          <p className="text-2xl font-bold text-white">{avgTechnical.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Avg Total</p>
          <p className="text-2xl font-bold text-white">{avgTotal.toFixed(1)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-slate-200">Recent judge feedback</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {list.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No scores yet. Judges score at /judge/evaluate.
            </div>
          ) : (
            list.map((s) => (
              <div key={s.id} className="px-6 py-4 hover:bg-slate-800/30">
                <p className="font-medium text-slate-200">{titleById[s.submission_id] ?? "—"}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>Innovation: {Number(s.innovation ?? 0).toFixed(1)}</span>
                  {s.uiux != null && <span>UI/UX: {Number(s.uiux).toFixed(1)}</span>}
                  <span>Technical: {Number(s.technical ?? 0).toFixed(1)}</span>
                  <span>Total: {Number(s.total_score ?? 0).toFixed(1)}</span>
                </div>
                {s.comments && (
                  <p className="mt-2 text-sm text-slate-500 italic">&quot;{s.comments}&quot;</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
