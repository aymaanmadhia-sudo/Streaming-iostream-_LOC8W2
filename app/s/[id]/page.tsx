import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";

async function getSubmission(id: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("submissions")
      .select("id, title, description, github_url, status, created_at")
      .eq("id", id)
      .single();
    return error ? null : data;
  } catch {
    return null;
  }
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Hackathon360 – Project
        </p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">{submission.title}</h1>
        {submission.description && (
          <p className="mt-3 text-sm text-slate-600">{submission.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              submission.status === "submitted"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {submission.status}
          </span>
        </div>
        {submission.github_url && (
          <a
            href={submission.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Open GitHub repo →
          </a>
        )}
        <div className="mt-8 border-t border-slate-200 pt-4">
          <Link
            href="/student/login"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Student login
          </Link>
        </div>
      </div>
    </div>
  );
}
