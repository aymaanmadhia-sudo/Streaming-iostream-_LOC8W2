"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type GitHubVerifyResult = {
  ok: boolean;
  error?: string;
  repo?: string;
  owner?: string;
  createdAt?: string;
  commits?: number;
  contributors?: number;
};

type SuccessState = {
  submissionId: string;
  qrCodeBase64: string;
};

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [description, setDescription] = useState("");
  const [verifyResult, setVerifyResult] = useState<GitHubVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/submissions");
        if (res.status === 401) router.replace("/auth/login");
      } catch {
        // Ignore
      }
    }
    checkAuth();
  }, [router]);

  async function handleVerify() {
    if (!githubUrl.trim()) return;
    setError(null);
    setVerifyResult(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/github/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl.trim() }),
      });
      let data: GitHubVerifyResult;
      try {
        data = await res.json();
      } catch {
        setVerifyResult({ ok: false, error: "Invalid response from server" });
        return;
      }
      if (!res.ok) {
        setVerifyResult({ ok: false, error: data.error ?? "Verification failed" });
        return;
      }
      setVerifyResult(data);
    } catch (e) {
      setVerifyResult({ ok: false, error: (e as Error).message });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !githubUrl.trim()) {
      setError("Title and GitHub URL are required.");
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          github_url: githubUrl.trim(),
          description: description.trim() || null,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        setSubmitting(false);
        return;
      }

      setSuccess({ submissionId: data.id, qrCodeBase64: data.qr_code });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center">
          <h2 className="text-xl font-semibold text-emerald-900">Submission successful</h2>
          <p className="mt-1 text-sm text-emerald-700">
            Your project has been submitted. Use this QR code for check-in or judging.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={success.qrCodeBase64}
                alt="Submission QR code"
                className="h-48 w-48 rounded-lg object-contain"
              />
              <p className="mt-2 text-xs text-slate-500">Submission ID: {success.submissionId.slice(0, 8)}…</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/student/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Go to dashboard
            </Link>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Submit your project
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Add your repo and description. We’ll verify the GitHub repo and generate a QR code for judges.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Project title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Awesome Hackathon Project"
          />
        </div>

        <div>
          <label htmlFor="github_url" className="block text-sm font-medium text-slate-700">
            GitHub repository URL
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="github_url"
              type="url"
              value={githubUrl}
              onChange={(e) => {
                setGithubUrl(e.target.value);
                setVerifyResult(null);
              }}
              required
              className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/username/repo"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || !githubUrl.trim()}
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Verify"}
            </button>
          </div>
          {verifyResult && (
            <div
              className={`mt-3 rounded-xl border p-4 ${
                verifyResult.ok
                  ? "border-emerald-200 bg-emerald-50/80"
                  : "border-red-200 bg-red-50/80"
              }`}
            >
              {verifyResult.ok ? (
                <>
                  <p className="text-sm font-medium text-emerald-800">Repository verified</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded bg-white/80 px-2 py-1.5">
                      <span className="text-slate-500">Created</span>
                      <p className="font-medium text-slate-800">
                        {verifyResult.createdAt
                          ? new Date(verifyResult.createdAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="rounded bg-white/80 px-2 py-1.5">
                      <span className="text-slate-500">Commits</span>
                      <p className="font-medium text-slate-800">{verifyResult.commits ?? "—"}</p>
                    </div>
                    <div className="rounded bg-white/80 px-2 py-1.5">
                      <span className="text-slate-500">Contributors</span>
                      <p className="font-medium text-slate-800">{verifyResult.contributors ?? "—"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-800">{verifyResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full resize-y rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your project, tech stack, and key features…"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit project"}
          </button>
          <Link
            href="/student"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
