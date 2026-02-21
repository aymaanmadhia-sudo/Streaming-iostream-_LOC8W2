import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { FoodCouponActions } from "./food-coupon-actions";

export default async function FoodCouponPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: coupons, error } = await supabase
    .from("food_coupons")
    .select("id, code, student_id, used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Food Coupon Control</h2>
          <p className="mt-1 text-sm text-slate-400">
            Run migration 006 to create food_coupons table.
          </p>
        </div>
        <div className="rounded-lg bg-amber-500/20 p-4 text-amber-300">
          Table not found: {error.message}. Add migration 006_food_qr_tables.sql in Supabase.
        </div>
      </div>
    );
  }

  const list = coupons ?? [];
  const studentIds = [...new Set(list.map((c) => c.student_id).filter(Boolean))];
  const { data: students } = studentIds.length
    ? await supabase.from("students").select("id, name").in("id", studentIds)
    : { data: [] };
  const nameById = (students ?? []).reduce(
    (acc, s) => ({ ...acc, [s.id]: s.name }),
    {} as Record<string, string>
  );

  const issued = list.length;
  const used = list.filter((c) => c.used_at).length;
  const unused = issued - used;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Food Coupon Control</h2>
        <p className="mt-1 text-sm text-slate-400">
          Real data from Supabase food_coupons table
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Issued</p>
          <p className="text-2xl font-bold text-white">{issued}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Used</p>
          <p className="text-2xl font-bold text-emerald-400">{used}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Unused</p>
          <p className="text-2xl font-bold text-amber-400">{unused}</p>
        </div>
      </div>

      <FoodCouponActions />

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Participant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Time</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No coupons yet. Generate coupons above.
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-200">{c.code}</td>
                    <td className="px-4 py-3 text-slate-400">{nameById[c.student_id ?? ""] ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={c.used_at ? "text-emerald-400" : "text-amber-400"}>
                        {c.used_at ? "Used" : "Unused"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {c.used_at ? new Date(c.used_at).toLocaleTimeString() : "—"}
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
