import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase-server";
import { generateQRDataUrl } from "@/lib/qr";
import { StudentDashboardClient } from "./student-dashboard-client";

export default async function StudentDashboardPage() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;
  console.log(`[student-dashboard] User ${user.id.slice(0, 8)}... has role: ${userRole || 'NONE'}`);

  // Students should access their dashboard, but allow admins to see it too
  if (userRole && userRole !== "student" && userRole !== "admin") {
    console.log(`[student-dashboard] User with role '${userRole}' - redirecting`);
    redirect("/dashboard");
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, title, description, github_url, github_stars, last_commit, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const personalQrPayload = `hackathon360:user:${user.id}`;
  const personalQrDataUrl = await generateQRDataUrl(personalQrPayload);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Student Dashboard</h1>
        <p className="mt-1 text-slate-400">Hackathon360 – Submit projects, QR check-in, and view history</p>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Your QR code</h2>
        <p className="mt-1 text-sm text-slate-400">Use &quot;Mark Entry&quot; or &quot;Mark Food&quot; below, or show this code at check-in.</p>
        <div className="mt-4 flex flex-wrap items-start gap-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personalQrDataUrl}
              alt="Personal QR code"
              className="h-40 w-40 rounded object-contain"
            />
            <p className="mt-2 text-xs text-slate-500">Personal ID</p>
          </div>
          <StudentDashboardClient />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Submission history</h2>
          <Link
            href="/student/submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            Submit project
          </Link>
        </div>
        {!submissions || submissions.length === 0 ? (
          <p className="mt-4 text-slate-400">No submissions yet. Submit your first project above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {submissions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-slate-700 bg-slate-800/50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{s.title}</p>
                    {s.description && (
                      <p className="mt-1 text-sm text-slate-400 line-clamp-2">{s.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {s.github_url && (
                        <a
                          href={s.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          GitHub →
                        </a>
                      )}
                      {s.github_stars != null && <span>Stars: {s.github_stars}</span>}
                      {s.last_commit && (
                        <span>Last commit: {new Date(s.last_commit).toLocaleDateString()}</span>
                      )}
                      <span className="capitalize">{s.status}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
