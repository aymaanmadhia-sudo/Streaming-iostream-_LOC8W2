"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FoodCouponActions() {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/food-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: Math.min(50, Math.max(1, count)) }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Failed to generate");
        return;
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">Generate coupons</h3>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min={1}
          max={50}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
          className="w-20 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-400">coupons</span>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
