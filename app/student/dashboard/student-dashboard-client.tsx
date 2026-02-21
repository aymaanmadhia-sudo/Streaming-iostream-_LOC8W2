"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState<"entry" | "food" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function logQr(type: "entry" | "food") {
    setMessage(null);
    setLoading(type);
    try {
      const res = await fetch("/api/qr-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Failed to log");
        return;
      }
      setMessage(type === "entry" ? "Entry marked." : "Food marked.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-300">Quick actions</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => logQr("entry")}
          disabled={!!loading}
          className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          {loading === "entry" ? "Marking…" : "Mark Entry"}
        </button>
        <button
          type="button"
          onClick={() => logQr("food")}
          disabled={!!loading}
          className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-600 disabled:opacity-50"
        >
          {loading === "food" ? "Marking…" : "Mark Food"}
        </button>
      </div>
      {message && (
        <p className="text-sm text-slate-400">{message}</p>
      )}
    </div>
  );
}
