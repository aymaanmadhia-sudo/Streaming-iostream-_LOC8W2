"use client";

import { useState } from "react";

export function GitHubVerifyForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; repo?: string; commits?: number; contributors?: number; error?: string } | null>(null);

  async function handleVerify() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/github/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setResult({ ok: false, error: "Invalid response from server" });
        return;
      }
      setResult(data);
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-300">Check repository</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setResult(null);
          }}
          placeholder="https://github.com/username/repo"
          className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || !url.trim()}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 font-medium text-white hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 transition"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </div>
      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {result.ok ? (
            <p>
              ✓ {result.repo} — {result.commits ?? 0} commits, {result.contributors ?? 0} contributors
            </p>
          ) : (
            <p>{result.error ?? "Verification failed"}</p>
          )}
        </div>
      )}
    </div>
  );
}
