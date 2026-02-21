import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminCommandCenterPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const [studentsRes, submissionsRes, pendingRes, scoresRes] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }),
    supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("scores").select("*", { count: "exact", head: true }),
  ]);

  let couponsIssued = 0;
  let couponsUsedCount = 0;
  let qrScans = 0;
  const [cTotal, cUsed, qr] = await Promise.all([
    supabase.from("food_coupons").select("*", { count: "exact", head: true }),
    supabase.from("food_coupons").select("*", { count: "exact", head: true }).not("used_at", "is", null),
    supabase.from("qr_scans").select("*", { count: "exact", head: true }),
  ]);
  if (!cTotal.error) couponsIssued = cTotal.count ?? 0;
  if (!cUsed.error) couponsUsedCount = cUsed.count ?? 0;
  if (!qr.error) qrScans = qr.count ?? 0;

  const participants = studentsRes.count ?? 0;
  const submissions = submissionsRes.count ?? 0;
  const pending = pendingRes.count ?? 0;
  const scoreCount = scoresRes.count ?? 0;
  const foodPct = couponsIssued > 0 ? Math.round((couponsUsedCount / couponsIssued) * 100) : 0;

  const monitoringCards = [
    { label: "Participants", value: participants, status: "normal", badge: null },
    { label: "QR Scans", value: qrScans, status: "normal", badge: null },
    { label: "Food Usage", value: `${foodPct}%`, status: foodPct >= 70 ? "warning" : "normal", badge: foodPct >= 70 ? "High" : null },
    { label: "Score Submissions", value: scoreCount, status: "normal", badge: null },
    { label: "Pending Review", value: pending, status: pending > 5 ? "warning" : "normal", badge: pending > 5 ? "Review" : null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Command Center</h2>
        <p className="mt-1 text-sm text-slate-400">
          Real-time metrics from Supabase
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {monitoringCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur relative overflow-hidden hover:border-slate-700 transition"
          >
            {card.badge && (
              <span
                className={`absolute right-2 top-2 rounded px-2 py-0.5 text-xs font-medium ${
                  card.status === "alert" ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {card.badge}
              </span>
            )}
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-white tabular-nums">{card.value}</p>
            <div
              className={`mt-2 h-1 w-24 rounded-full ${
                card.status === "alert" ? "bg-rose-500" : card.status === "warning" ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
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
          href="/dashboard/food-coupon"
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Food coupons
        </Link>
      </div>
    </div>
  );
}
