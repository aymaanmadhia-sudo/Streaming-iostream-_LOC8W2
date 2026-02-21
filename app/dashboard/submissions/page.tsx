import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function DashboardSubmissionsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: subs, error } = await supabase
    .from("submissions")
    .select("id, title, description, github_url, status, created_at, student_id")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-400">
        Error loading submissions: {error.message}
      </div>
    );
  }

  const list = subs ?? [];
  const studentIds = [...new Set(list.map((s) => s.student_id).filter(Boolean))];
  const { data: students } = studentIds.length
    ? await supabase.from("students").select("id, email").in("id", studentIds)
    : { data: [] };
  const emailById = (students ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s.email }),
    {} as Record<string, string>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Submissions</h2>
          <p className="mt-1 text-sm text-slate-400">All project submissions from Supabase</p>
        </div>
        <Link
          href="/admin/submissions"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Review & approve
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Student</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">GitHub</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No submissions yet
                  </td>
                </tr>
              ) : (
                list.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-200">{s.title}</td>
                    <td className="px-4 py-3 text-slate-400">{emailById[s.student_id] ?? "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={s.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Link
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          s.status === "approved"
                            ? "text-emerald-400"
                            : s.status === "rejected"
                              ? "text-red-400"
                              : "text-amber-400"
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
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
