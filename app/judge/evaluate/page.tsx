import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { fetchUserRole } from "@/lib/role-utils";
import { JudgeEvaluateList } from "./judge-evaluate-list";

export default async function JudgeEvaluatePage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user role from centralized utility (no silent defaults)
  const userRole = await fetchUserRole(supabase, user.id, "judge-evaluate-page");
  if (userRole !== "judge") {
    console.warn(`[JudgeEvaluate] User ${user.id.slice(0, 8)}... with role '${userRole || 'NONE'}' accessing /judge/evaluate - redirecting to /dashboard`);
    redirect("/dashboard");
  }

  const [subsRes, scoresRes] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, title, description, github_url, demo_url, status, user_id, team_id")
      .in("status", ["pending", "submitted", "approved"])
      .order("created_at", { ascending: false }),
    supabase.from("scores").select("submission_id").eq("judge_id", user.id),
  ]);

  const allSubmissions = (subsRes.data ?? []) as Array<{
    id: string;
    title: string;
    description: string | null;
    github_url: string;
    demo_url: string | null;
    status: string;
    user_id: string | null;
    team_id: string | null;
  }>;

  // Get team and user information
  const teamIds = [...new Set(allSubmissions.map((s) => s.team_id).filter(Boolean))] as string[];
  const userIds = [...new Set(allSubmissions.map((s) => s.user_id).filter(Boolean))] as string[];

  const [teamsRes, usersRes] = await Promise.all([
    teamIds.length > 0
      ? supabase.from("teams").select("id, team_name").in("id", teamIds)
      : { data: [] },
    userIds.length > 0
      ? supabase.from("users").select("id, name").in("id", userIds)
      : { data: [] },
  ]);

  const teamsById = (teamsRes.data ?? []).reduce((acc, t) => ({ ...acc, [t.id]: t }), {} as Record<string, any>);
  const usersById = (usersRes.data ?? []).reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, any>);

  // Get team members for each team
  const teamMembersRes = teamIds.length > 0
    ? await supabase
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", teamIds)
    : { data: [] };

  const memberUserIds = (teamMembersRes.data ?? []).map((m) => m.user_id).filter((id) => !usersById[id]);
  const additionalUsersRes = memberUserIds.length > 0
    ? await supabase.from("users").select("id, name, email").in("id", memberUserIds)
    : { data: [] };

  const allUsersMap = {
    ...usersById,
    ...(additionalUsersRes.data ?? []).reduce((acc, u) => ({ ...acc, [u.id]: u }), {} as Record<string, any>),
  };

  const membersByTeam = (teamMembersRes.data ?? []).reduce((acc, m) => {
    if (!acc[m.team_id]) acc[m.team_id] = [];
    const user = allUsersMap[m.user_id];
    if (user) acc[m.team_id].push(user);
    return acc;
  }, {} as Record<string, any[]>);

  const enrichedSubmissions = allSubmissions.map((s) => ({
    ...s,
    teamName: s.team_id ? teamsById[s.team_id]?.team_name : null,
    teamMembers: s.team_id ? membersByTeam[s.team_id] : null,
    studentName: s.user_id ? usersById[s.user_id]?.name : null,
  }));

  const reviewedIds = new Set((scoresRes.data ?? []).map((s) => s.submission_id));
  const submissions = enrichedSubmissions.filter((s) => !reviewedIds.has(s.id));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-white">Evaluate submissions</h1>
      <p className="text-slate-400">
        Score verified projects (0–10). Submissions you have already reviewed are excluded. After scoring, status becomes &quot;evaluated&quot;.
      </p>
      <JudgeEvaluateList submissions={submissions} />
    </div>
  );
}
