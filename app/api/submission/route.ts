import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { cookies } from "next/headers";
import { generateQRDataUrl } from "@/lib/qr";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    get: (name: string) => cookieStore.get(name) ?? undefined,
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieStore.set(name, value, options);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  });
}

/**
 * GET: List submissions for the current user or leaderboard.
 * Query: ?leaderboard=true for public leaderboard.
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leaderboard = request.nextUrl.searchParams.get("leaderboard") === "true";

  if (leaderboard) {
    const { data: submissions, error: subErr } = await supabase
      .from("submissions")
      .select("id, title, status, created_at, user_id, team_id")
      .order("created_at", { ascending: false });

    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const { data: scores } = await supabase.from("scores").select("submission_id, total");
    const bySubmission = (scores ?? []).reduce(
      (acc, s) => {
        if (!acc[s.submission_id]) acc[s.submission_id] = { sum: 0, count: 0 };
        acc[s.submission_id].sum += Number(s.total);
        acc[s.submission_id].count += 1;
        return acc;
      },
      {} as Record<string, { sum: number; count: number }>
    );

    // Get team and user info
    let namesById: Record<string, string> = {};
    let teamsById: Record<string, string> = {};
    try {
      const admin = createAdminClient();
      const { data: userRows } = await admin.from("users").select("id, name");
      namesById = (userRows ?? []).reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>);
    } catch {
      // Service role not configured
    }

    const teamIds = [...new Set(
      (submissions ?? [])
        .map((s: any) => s.team_id)
        .filter(Boolean) as string[]
    )];
    if (teamIds.length > 0) {
      const { data: teamRows } = await supabase
        .from("teams")
        .select("id, team_name")
        .in("id", teamIds);
      teamsById = (teamRows ?? []).reduce((acc, t) => ({ ...acc, [t.id]: t.team_name }), {} as Record<string, string>);
    }

    const withScores = (submissions ?? []).map((s: any) => {
      const sc = bySubmission[s.id] ?? { sum: 0, count: 0 };
      const name = s.team_id ? teamsById[s.team_id] : namesById[s.user_id] ?? "—";
      return {
        ...s,
        name,
        totalScore: sc.sum,
        judgesCount: sc.count,
        avgScore: sc.count > 0 ? Math.round((sc.sum / sc.count) * 10) / 10 : null,
      };
    });
    const sorted = withScores.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    const ranked = sorted.map((s, i) => ({ ...s, rank: i + 1 }));
    return NextResponse.json(ranked);
  }

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST: Create or update submission. Generates QR code and saves to DB.
 * If user is in a team, creates team submission. Otherwise creates individual submission.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; github_url?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const github_url = typeof body?.github_url === "string" ? body.github_url.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  if (!title || !github_url) {
    return NextResponse.json(
      { error: "title and github_url are required" },
      { status: 400 }
    );
  }

  // Check if user is in a team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Determine if this is team or individual submission
  const isTeamSubmission = !!membership;
  const teamId = membership?.team_id || null;

  // Find existing submission for this user/team
  let existingQuery = supabase.from("submissions").select("id");
  if (isTeamSubmission) {
    existingQuery = existingQuery.eq("team_id", teamId);
  } else {
    existingQuery = existingQuery.eq("user_id", user.id);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  const submissionId = existing?.id ?? crypto.randomUUID();
  const qrPayload = `${APP_URL}/s/${submissionId}`;
  const qr_code = await generateQRDataUrl(qrPayload);

  const row = {
    id: submissionId,
    user_id: isTeamSubmission ? null : user.id,
    team_id: isTeamSubmission ? teamId : null,
    title,
    github_url,
    description: description || null,
    status: "submitted",
    qr_code,
    github_verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("submissions")
      .update({
        title: row.title,
        github_url: row.github_url,
        description: row.description,
        status: row.status,
        qr_code: row.qr_code,
        github_verified_at: row.github_verified_at,
        updated_at: row.updated_at,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase.from("submissions").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
