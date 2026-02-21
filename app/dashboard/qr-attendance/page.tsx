import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { QRScanForm } from "./qr-scan-form";

export default async function QRAttendancePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: scans, error } = await supabase
    .from("qr_scans")
    .select("id, submission_id, scanned_at")
    .order("scanned_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">QR Attendance</h2>
          <p className="mt-1 text-sm text-slate-400">
            Run migration 006 to create qr_scans table.
          </p>
        </div>
        <div className="rounded-lg bg-amber-500/20 p-4 text-amber-300">
          Table not found: {error.message}. Add migration 006_food_qr_tables.sql in Supabase.
        </div>
      </div>
    );
  }

  const list = scans ?? [];
  const submissionIds = [...new Set(list.map((s) => s.submission_id).filter(Boolean))];
  const { data: subs } = submissionIds.length
    ? await supabase.from("submissions").select("id, title").in("id", submissionIds)
    : { data: [] };
  const titleById = (subs ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s.title }),
    {} as Record<string, string>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">QR Attendance</h2>
        <p className="mt-1 text-sm text-slate-400">
          Record check-ins via QR scan (from Supabase qr_scans)
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-2xl font-bold text-white">{list.length}</p>
        <p className="text-xs text-slate-500">Total scans</p>
      </div>

      <QRScanForm />

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="font-semibold text-slate-200">Recent scans</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {list.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-500">
              No scans yet. Students present their submission QR at check-in.
            </div>
          ) : (
            list.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30">
                <span className="font-medium text-slate-200">
                  {titleById[s.submission_id] ?? s.submission_id?.slice(0, 8)}
                </span>
                <span className="text-sm text-slate-500">
                  {new Date(s.scanned_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
