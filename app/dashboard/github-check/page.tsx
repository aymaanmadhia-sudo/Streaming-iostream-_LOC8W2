import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import { GitHubVerifyForm } from "./github-verify-form";

export default async function GitHubCheckPage() {
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
    .select("id, title, github_url, github_verified_at, created_at")
    .not("github_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const repos = (subs ?? []).map((s) => ({
    id: s.id,
    repo: s.github_url.replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "") || s.github_url,
    verified: !!s.github_verified_at,
    created: new Date(s.created_at).toLocaleDateString(),
    title: s.title,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">GitHub Authenticity Check</h2>
        <p className="mt-1 text-sm text-slate-400">
          Submissions with GitHub URLs (from Supabase)
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
        <GitHubVerifyForm />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-slate-200">Submitted repositories</h3>
          <p className="mt-1 text-xs text-slate-500">{repos.length} submissions with GitHub URLs</p>
        </div>
        <div className="divide-y divide-slate-800">
          {repos.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">No submissions with GitHub URLs yet</div>
          ) : (
            repos.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-slate-800/30"
              >
                <span className="font-mono text-sm text-slate-300">{r.repo}</span>
                <span className="text-xs text-slate-500">Submitted: {r.created}</span>
                <span className="text-xs text-slate-500">{r.title}</span>
                <span
                  className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.verified ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {r.verified ? "Verified" : "Pending"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
