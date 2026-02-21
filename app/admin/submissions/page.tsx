import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { AdminSubmissionsTable } from "./admin-submissions-table";

export default async function AdminSubmissionsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: subs, error: subsErr } = await supabase
    .from("submissions")
    .select("id, title, description, github_url, demo_url, status, created_at, user_id, team_id, student_id")
    .order("created_at", { ascending: false });

  if (subsErr) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-400">
        Error loading submissions: {subsErr.message}
      </div>
    );
  }

  const list = subs ?? [];

  // Get team IDs
  const teamIds = [...new Set(
    list
      .map((s) => (s as { team_id?: string }).team_id)
      .filter(Boolean) as string[]
  )];

  // Get user IDs (for individual submissions and team leaders)
  const userIds = [...new Set(
    list
      .map((s) => {
        const submission = s as { user_id?: string; student_id?: string };
        return submission.user_id ?? submission.student_id;
      })
      .filter(Boolean) as string[]
  )];

  // Fetch teams
  const teamsRes = teamIds.length > 0
    ? await supabase.from("teams").select("id, team_name, leader_id").in("id", teamIds)
    : { data: [] };

  // Fetch users
  const usersRes = userIds.length > 0
    ? await supabase.from("users").select("id, email, name").in("id", userIds)
    : { data: [] };

  const teamsById = (teamsRes.data ?? []).reduce((acc, t) => ({ ...acc, [t.id]: t }), {} as Record<string, any>);
  const emailById = (usersRes.data ?? []).reduce((acc, p) => ({ ...acc, [p.id]: p.email }), {} as Record<string, string>);

  // Get team member info for teams
  const teamMembersRes = teamIds.length > 0
    ? await supabase
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", teamIds)
    : { data: [] };

  const memberUserIds = (teamMembersRes.data ?? [])
    .map((m) => m.user_id)
    .filter((id) => !emailById[id]);

  const additionalUsersRes = memberUserIds.length > 0
    ? await supabase.from("users").select("id, email, name").in("id", memberUserIds)
    : { data: [] };

  const allEmailsById = {
    ...emailById,
    ...(additionalUsersRes.data ?? []).reduce((acc, p) => ({ ...acc, [p.id]: p.email }), {} as Record<string, string>),
  };

  const membersByTeam = (teamMembersRes.data ?? []).reduce((acc, m) => {
    if (!acc[m.team_id]) acc[m.team_id] = [];
    acc[m.team_id].push(allEmailsById[m.user_id] || "?");
    return acc;
  }, {} as Record<string, string[]>);

  const rows = list.map((s) => {
    const submission = s as { user_id?: string; student_id?: string; team_id?: string };
    const uid = submission.user_id ?? submission.student_id;
    const teamId = submission.team_id;

    if (teamId) {
      const team = teamsById[teamId];
      return {
        ...s,
        studentEmail: team?.team_name || "?",
        teamName: team?.team_name || "?",
        teamMembers: membersByTeam[teamId] || [],
        isTeam: true,
      };
    }

    return {
      ...s,
      studentEmail: emailById[uid ?? ""] ?? "—",
      isTeam: false,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Submissions</h1>
      <AdminSubmissionsTable submissions={rows} />
    </div>
  );
}
