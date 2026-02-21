import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export default async function AdminTeamsPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  // Fetch all teams
  const { data: teams, error: teamsErr } = await supabase
    .from("teams")
    .select("id, team_name, leader_id, created_at")
    .order("created_at", { ascending: false });

  if (teamsErr) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-900/30 p-4 text-red-400">
        Error loading teams: {teamsErr.message}
      </div>
    );
  }

  const teamList = teams ?? [];
  const teamIds = teamList.map((t) => t.id);
  const leaderIds = [...new Set(teamList.map((t) => t.leader_id))];

  // Fetch leaders
  const leadersRes = leaderIds.length > 0
    ? await supabase.from("users").select("id, name, email").in("id", leaderIds)
    : { data: [] };

  const leadersById = (leadersRes.data ?? []).reduce(
    (acc, u) => ({ ...acc, [u.id]: u }),
    {} as Record<string, any>
  );

  // Fetch team members
  const membersRes = teamIds.length > 0
    ? await supabase
        .from("team_members")
        .select("team_id, user_id")
        .in("team_id", teamIds)
    : { data: [] };

  const memberUserIds = [...new Set((membersRes.data ?? []).map((m) => m.user_id))];
  const usersRes = memberUserIds.length > 0
    ? await supabase.from("users").select("id, name, email").in("id", memberUserIds)
    : { data: [] };

  const usersById = (usersRes.data ?? []).reduce(
    (acc, u) => ({ ...acc, [u.id]: u }),
    {} as Record<string, any>
  );

  const membersByTeam = (membersRes.data ?? []).reduce((acc, m) => {
    if (!acc[m.team_id]) acc[m.team_id] = [];
    const user = usersById[m.user_id];
    if (user) acc[m.team_id].push(user);
    return acc;
  }, {} as Record<string, any[]>);

  // Fetch submissions per team
  const submissionsRes = teamIds.length > 0
    ? await supabase
        .from("submissions")
        .select("team_id, id")
        .in("team_id", teamIds)
    : { data: [] };

  const submissionsByTeam = (submissionsRes.data ?? []).reduce((acc, s) => {
    if (!acc[s.team_id]) acc[s.team_id] = 0;
    acc[s.team_id]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Teams</h1>
        <p className="mt-1 text-slate-400">All registered teams and their members</p>
      </div>

      {teamList.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-center text-slate-400">
          No teams created yet.
        </div>
      ) : (
        <div className="space-y-4">
          {teamList.map((team) => {
            const leader = leadersById[team.leader_id];
            const members = membersByTeam[team.id] || [];
            const submissions = submissionsByTeam[team.id] || 0;

            return (
              <div
                key={team.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white">{team.team_name}</h2>
                    <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500">Leader</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {leader?.name} ({leader?.email})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Members</p>
                        <p className="mt-1 text-sm text-slate-300">{members.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Submissions</p>
                        <p className="mt-1 text-sm text-slate-300">{submissions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {new Date(team.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {members.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-300">Team Members:</p>
                        <ul className="mt-2 space-y-1">
                          {members.map((member) => (
                            <li key={member.id} className="text-sm text-slate-400">
                              <span className="text-cyan-400">•</span> {member.name} ({member.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
