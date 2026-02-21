import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminLogsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: logs, error } = await supabase
    .from("qr_logs")
    .select("id, user_id, type, timestamp")
    .order("timestamp", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">QR logs</h2>
        <p className="rounded-lg border border-amber-800 bg-amber-900/20 p-4 text-sm text-amber-200">
          Could not load qr_logs. Ensure migration 008 has been run and the qr_logs table exists.
        </p>
      </div>
    );
  }

  const userIds = [...new Set((logs ?? []).map((l) => l.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email").in("id", userIds)
    : { data: [] };
  const emailById = (profiles ?? []).reduce(
    (acc, p) => ({ ...acc, [p.id]: p.email }),
    {} as Record<string, string>
  );

  const entryCount = (logs ?? []).filter((l) => l.type === "entry").length;
  const foodCount = (logs ?? []).filter((l) => l.type === "food").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">QR logs</h2>
        <p className="mt-1 text-sm text-slate-400">
          Entry and food check-ins from students (Mark Entry / Mark Food).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-medium text-slate-400">Entry</p>
          <p className="mt-1 text-2xl font-semibold text-white">{entryCount}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-sm font-medium text-slate-400">Food</p>
          <p className="mt-1 text-2xl font-semibold text-white">{foodCount}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">User</th>
              </tr>
            </thead>
            <tbody>
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No QR logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-200">{l.type}</td>
                    <td className="px-4 py-3 text-slate-400">{emailById[l.user_id] ?? l.user_id}</td>
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
