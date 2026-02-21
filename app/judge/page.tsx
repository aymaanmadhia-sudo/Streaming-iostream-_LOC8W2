import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function JudgePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;
  console.log(`[judge-page] User ${user.id.slice(0, 8)}... has role: ${userRole || 'NONE'}`);

  // Judge-only page
  if (userRole !== "judge") {
    console.warn(`[judge-page] User with role '${userRole}' tried to access /judge - redirecting`);
    redirect("/dashboard");
  }

  const [
    subsRes,
    scoresRes,
  ] = await Promise.all([
    supabase.from("submissions").select("id, status").in("status", ["pending", "submitted", "approved", "evaluated"]),
    supabase.from("scores").select("submission_id").eq("judge_id", user.id),
  ]);

  const allSubs = subsRes.data ?? [];
  const reviewedIds = new Set((scoresRes.data ?? []).map((s) => s.submission_id));
  const verifiedCount = allSubs.filter((s) => ["pending", "submitted", "approved"].includes(s.status)).length;
  const evaluatedCount = allSubs.filter((s) => s.status === "evaluated").length;
  const reviewedByMe = reviewedIds.size;
  const pendingReviews = allSubs.filter((s) => !reviewedIds.has(s.id) && ["pending", "submitted", "approved"].includes(s.status)).length;

  const cards = [
    { label: "Verified submissions", value: verifiedCount },
    { label: "Reviewed by you", value: reviewedByMe },
    { label: "Pending your review", value: pendingReviews },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Judge Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div>
        <Link
          href="/judge/evaluate"
          className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-500"
        >
          Evaluate submissions →
        </Link>
      </div>
    </div>
  );
}
