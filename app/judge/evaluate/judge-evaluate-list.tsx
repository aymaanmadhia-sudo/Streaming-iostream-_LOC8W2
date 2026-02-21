"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Submission = {
  id: string;
  title: string;
  description: string | null;
  github_url: string;
  demo_url: string | null;
  status: string;
  teamName?: string | null;
  teamMembers?: Array<{ id: string; name: string; email: string }> | null;
  studentName?: string | null;
};

export function JudgeEvaluateList({
  submissions,
}: {
  submissions: Submission[];
}) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localReviewed, setLocalReviewed] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, { innovation: number; technical: number; presentation: number; comments: string }>>({});

  const justSubmitted = new Set(localReviewed);
  const toShow = submissions.filter((s) => !justSubmitted.has(s.id));

  function setScore(submissionId: string, field: "innovation" | "technical" | "presentation" | "comments", value: number | string) {
    setScores((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] ?? { innovation: 5, technical: 5, presentation: 5, comments: "" }),
        [field]: value,
      },
    }));
  }

  async function submitScore(submissionId: string) {
    const s = scores[submissionId] ?? { innovation: 5, technical: 5, presentation: 5, comments: "" };
    setError(null);
    setSubmittingId(submissionId);
    try {
      const res = await fetch("/api/judge/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionId,
          innovation: s.innovation,
          technical: s.technical,
          presentation: s.presentation,
          comments: s.comments,
        }),
      });
      let json;
      try {
        json = await res.json();
      } catch {
        setError("Invalid response from server");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Failed to submit score");
        return;
      }
      setLocalReviewed((prev) => new Set([...prev, submissionId]));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmittingId(null);
    }
  }

  if (toShow.length === 0) {
    return <p className="text-slate-400">No verified submissions left to evaluate.</p>;
  }

  return (
    <>
      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-800 p-2 text-sm text-red-400">{error}</p>
      )}
      <div className="space-y-8">
        {toShow.map((sub) => {
          const s = scores[sub.id] ?? { innovation: 5, technical: 5, presentation: 5, comments: "" };
          const total = s.innovation + s.technical + s.presentation;
          const isSubmitting = submittingId === sub.id;

          return (
            <div
              key={sub.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-white">{sub.title}</h2>
              {sub.description && (
                <p className="mt-2 text-sm text-slate-400">{sub.description}</p>
              )}

              {/* Show team or student info */}
              {sub.teamName ? (
                <div className="mt-3 rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <p className="text-sm font-medium text-cyan-400">Team: {sub.teamName}</p>
                  {sub.teamMembers && sub.teamMembers.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      <p className="font-medium mb-1">Members:</p>
                      <ul className="space-y-1 ml-2">
                        {sub.teamMembers.map((member) => (
                          <li key={member.id}>
                            {member.name} ({member.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : sub.studentName ? (
                <div className="mt-3 text-sm text-slate-400">
                  <p>By: <span className="text-slate-300">{sub.studentName}</span></p>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={sub.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                >
                  GitHub →
                </a>
                {sub.demo_url && (
                  <a
                    href={sub.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
                  >
                    Demo →
                  </a>
                )}
              </div>

              <div className="mt-6 space-y-4 border-t border-slate-700 pt-6">
                  <p className="text-sm font-medium text-slate-300">Scores (0–10)</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs text-slate-500">Innovation</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={s.innovation}
                        onChange={(e) => setScore(sub.id, "innovation", parseInt(e.target.value, 10) || 0)}
                        className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Technical</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={s.technical}
                        onChange={(e) => setScore(sub.id, "technical", parseInt(e.target.value, 10) || 0)}
                        className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Presentation</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={s.presentation}
                        onChange={(e) => setScore(sub.id, "presentation", parseInt(e.target.value, 10) || 0)}
                        className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-400">Total: {total}</p>
                  <div>
                    <label className="block text-xs text-slate-500">Comments</label>
                    <textarea
                      value={s.comments}
                      onChange={(e) => setScore(sub.id, "comments", e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional feedback..."
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => submitScore(sub.id)}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting…" : "Submit score"}
                  </button>
                </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
