"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  title: string;
  github_url: string;
  status: string;
  studentEmail: string;
  teamName?: string;
  teamMembers?: string[];
  isTeam?: boolean;
};

export function AdminSubmissionsTable({ submissions }: { submissions: Row[] }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(submissionId: string, status: "approved" | "rejected") {
    setError(null);
    setUpdatingId(submissionId);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      let json;
      try {
        json = await res.json();
      } catch {
        setError("Invalid response from server");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Update failed");
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      {error && (
        <p className="rounded-lg border border-red-800 bg-red-900/30 p-2 text-sm text-red-400">{error}</p>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/50">
              <th className="px-4 py-3 text-left font-semibold text-slate-200">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-200">Participant / Team</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-200">GitHub URL</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-200">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((row) => {
                const isUpdating = updatingId === row.id;
                return (
                  <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">{row.title}</td>
                    <td className="px-4 py-3">
                      {row.isTeam ? (
                        <div className="text-sm">
                          <p className="font-medium text-cyan-400">{row.teamName}</p>
                          {row.teamMembers && row.teamMembers.length > 0 && (
                            <div className="mt-1 text-xs text-slate-400">
                              {row.teamMembers.join(", ")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">{row.studentEmail}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={row.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        {row.github_url.slice(0, 40)}
                        {row.github_url.length > 40 ? "…" : ""}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === "approved"
                            ? "bg-emerald-900/50 text-emerald-300"
                            : row.status === "rejected"
                              ? "bg-red-900/50 text-red-300"
                              : row.status === "evaluated"
                                ? "bg-cyan-900/50 text-cyan-300"
                                : "bg-amber-900/50 text-amber-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "pending" || row.status === "submitted" ? (
                        <span className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateStatus(row.id, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateStatus(row.id, "rejected")}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
