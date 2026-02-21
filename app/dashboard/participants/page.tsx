import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function ParticipantsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: participants, error } = await supabase
    .from("students")
    .select("id, name, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 p-4 text-red-400">
        Error loading participants: {error.message}
      </div>
    );
  }

  const list = participants ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Participants</h2>
        <p className="mt-1 text-sm text-slate-400">
          Students registered via the student flow (from Supabase)
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-200">Registered</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No participants yet
                  </td>
                </tr>
              ) : (
                list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-200">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400">{p.email}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
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
