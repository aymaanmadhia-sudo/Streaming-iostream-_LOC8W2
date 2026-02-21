"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: string;
  team_name: string;
  leader_id: string;
  created_at: string;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  isLeader: boolean;
};

export default function StudentTeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTeamName, setCreateTeamName] = useState("");
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      setLoading(true);
      const res = await fetch("/api/teams");
      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }
      if (!res.ok) {
        setError("Failed to fetch team");
        return;
      }
      const data = await res.json();
      setTeam(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!createTeamName.trim()) {
      setError("Team name is required");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setCreating(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: createTeamName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create team");
        return;
      }

      setTeam(data);
      setCreateTeamName("");
      setSuccessMsg("Team created successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addMemberEmail.trim() || !team?.id) {
      setError("Email is required");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setAdding(true);

    try {
      const res = await fetch("/api/teams/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, email: addMemberEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add member");
        return;
      }

      // Refresh team data
      await fetchTeam();
      setAddMemberEmail("");
      setSuccessMsg("Member added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Team Management</h1>
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Team Management</h1>
        <p className="text-slate-400">Create a team to submit as a group</p>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Create a new team</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-900/30 border border-red-800 p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={createTeamName}
                onChange={(e) => setCreateTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={creating}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Team Management</h1>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 p-3 text-green-400 text-sm">
          {successMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-medium text-white mb-2">{team.team_name}</h2>
        <p className="text-sm text-slate-400 mb-4">
          {team.isLeader ? "You are the team leader" : "You are a team member"}
        </p>

        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <p className="text-sm text-slate-400">Team Members ({team.members.length})</p>
          <ul className="mt-3 space-y-2">
            {team.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-white">{member.name}</p>
                  <p className="text-slate-500 text-xs">{member.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {team.isLeader && (
          <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="email"
                value={addMemberEmail}
                onChange={(e) => setAddMemberEmail(e.target.value)}
                placeholder="Enter member email"
                className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={adding}
              />
              <button
                type="submit"
                disabled={adding}
                className="w-full px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-500 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
