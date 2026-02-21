"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QRScanForm() {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecord() {
    if (!submissionId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId.trim() }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Failed to record scan");
        return;
      }
      setSubmissionId("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Record scan (manual entry)</h3>
      <p className="mb-3 text-xs text-slate-500">
        Enter submission ID from QR code to record check-in
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={submissionId}
          onChange={(e) => setSubmissionId(e.target.value)}
          placeholder="Submission UUID"
          className="min-w-[220px] rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleRecord}
          disabled={loading || !submissionId.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Recording…" : "Record scan"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
