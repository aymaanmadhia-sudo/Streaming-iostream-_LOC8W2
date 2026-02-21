import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { fetchUserRole } from "@/lib/role-utils";

export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";

  // Parse request body
  let body: { submission_id?: string; innovation?: number; technical?: number; presentation?: number; comments?: string };
  try {
    body = await request.json();
  } catch {
    console.error("[Judge Scores] Invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { submission_id, innovation, technical, presentation, comments } = body ?? {};

  // Validate required fields
  if (
    typeof submission_id !== "string" ||
    typeof innovation !== "number" ||
    typeof technical !== "number" ||
    typeof presentation !== "number"
  ) {
    console.error("[Judge Scores] Missing required fields");
    return NextResponse.json(
      { error: "Missing or invalid fields (submission_id, innovation, technical, presentation)" },
      { status: 400 }
    );
  }

  if (isDev) {
    console.log(`[Judge Scores] Scoring submission ${submission_id.slice(0, 8)}...`);
  }

  // Clamp scores to 0-10 range
  const inv = Math.min(10, Math.max(0, Math.round(innovation)));
  const tech = Math.min(10, Math.max(0, Math.round(technical)));
  const pres = Math.min(10, Math.max(0, Math.round(presentation)));
  const total_score = inv + tech + pres;

  if (isDev) {
    console.log(`[Judge Scores] Scores: innovation=${inv}, technical=${tech}, presentation=${pres}, total=${total_score}`);
  }

  // Create Supabase client
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    get: (name) => cookieStore.get(name) ?? undefined,
    set: (name, value, options) => cookieStore.set(name, value, options),
    delete: (name) => cookieStore.delete(name),
  });

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[Judge Scores] No authenticated user");
    return NextResponse.json({ error: "Unauthorized: Not logged in" }, { status: 401 });
  }

  if (isDev) {
    console.log(`[Judge Scores] User ${user.id.slice(0, 8)}... attempting to submit score`);
  }

  // Fetch user role using centralized utility
  const userRole = await fetchUserRole(supabase, user.id, "judge-scores-api");

  if (!userRole) {
    console.error(`[Judge Scores] No role found for user ${user.id}`);
    return NextResponse.json(
      { error: "Forbidden: Your profile has no role. Contact admin." },
      { status: 403 }
    );
  }

  // Verify judge role
  if (userRole !== "judge") {
    console.error(`[Judge Scores] User ${user.id} has role '${userRole}', not 'judge'`);
    return NextResponse.json(
      { error: `Forbidden: Only judges can submit scores. Your role is '${userRole}'.` },
      { status: 403 }
    );
  }

  if (isDev) {
    console.log(`[Judge Scores] Role verified: judge`);
  }

  // Check if judge already scored this submission
  const { data: existing, error: checkError } = await supabase
    .from("scores")
    .select("id")
    .eq("submission_id", submission_id)
    .eq("judge_id", user.id)
    .maybeSingle();

  if (checkError) {
    console.error(`[Judge Scores] Error checking existing score:`, checkError);
    return NextResponse.json({ error: "Database error while checking existing scores" }, { status: 500 });
  }

  if (existing) {
    console.warn(`[Judge Scores] Judge ${user.id.slice(0, 8)}... already scored submission ${submission_id.slice(0, 8)}...`);
    return NextResponse.json({ error: "Already reviewed this submission" }, { status: 409 });
  }

  // Insert score
  const scoreRow: Record<string, unknown> = {
    submission_id,
    judge_id: user.id,
    innovation: inv,
    technical: tech,
    presentation: pres,
    total_score,
    comments: typeof comments === "string" ? comments : null,
  };

  if (isDev) {
    console.log(`[Judge Scores] Inserting score:`, scoreRow);
  }

  const { error: insertError } = await supabase.from("scores").insert(scoreRow);

  if (insertError) {
    console.error(`[Judge Scores] Failed to insert score:`, insertError);
    return NextResponse.json(
      { error: `Failed to submit score: ${insertError.message}` },
      { status: 500 }
    );
  }

  console.log(`[Judge Scores] ✓ Score inserted successfully`);

  // Update submission status to evaluated
  const { error: updateError } = await supabase
    .from("submissions")
    .update({ status: "evaluated", updated_at: new Date().toISOString() })
    .eq("id", submission_id);

  if (updateError) {
    console.error(`[Judge Scores] Warning: Failed to update submission status:`, updateError);
    // Don't fail the request - score was inserted successfully
  }

  if (isDev) {
    console.log(`[Judge Scores] Submission status updated to 'evaluated'`);
  }

  return NextResponse.json({ ok: true, score: { inv, tech, pres, total: total_score } });
}
