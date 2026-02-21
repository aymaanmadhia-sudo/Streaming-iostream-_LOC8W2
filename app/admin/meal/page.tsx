import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminMealPage() {
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
          <h2 className="text-2xl font-bold text-slate-900">Food Coupon Control</h2>
          <p className="mt-1 text-sm text-slate-500">
            Run migration 006 to create food_coupons table.
          </p>
        </div>
        <div className="rounded-lg bg-amber-100 p-4 text-amber-800">
          Table not found: {error.message}. Add migration 006_food_qr_tables.sql in Supabase.
        </div>
        <Link href="/dashboard/food-coupon" className="text-sm text-blue-600 hover:underline">
          Go to dashboard food coupon →
        </Link>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Food Coupon Control</h2>
          <p className="mt-1 text-sm text-slate-500">Real data from Supabase</p>
        </div>
        <Link
          href="/dashboard/food-coupon"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Generate coupons →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total Issued</p>
          <p className="text-2xl font-bold text-slate-900">{issued}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Used</p>
          <p className="text-2xl font-bold text-emerald-600">{used}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Unused</p>
          <p className="text-2xl font-bold text-amber-600">{unused}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-700">Coupon log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Coupon ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Participant</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Redeemed At</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No coupons yet. Generate at <Link href="/dashboard/food-coupon" className="text-blue-600 hover:underline">dashboard</Link>.
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-600">{c.code}</td>
                    <td className="px-4 py-3 text-slate-600">{nameById[c.student_id ?? ""] ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={c.used_at ? "text-emerald-600" : "text-amber-600"}>
                        {c.used_at ? "Used" : "Unused"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.used_at ? new Date(c.used_at).toLocaleString() : "—"}
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
