import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

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
 * POST: Add a member to the team (leader only)
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { teamId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teamId = typeof body?.teamId === "string" ? body.teamId.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!teamId || !email) {
    return NextResponse.json({ error: "teamId and email are required" }, { status: 400 });
  }

  // Verify user is team leader
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, leader_id")
    .eq("id", teamId)
    .single();

  if (teamErr || !team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (team.leader_id !== user.id) {
    return NextResponse.json({ error: "Only team leader can add members" }, { status: 403 });
  }

  // Find user by email
  const { data: newMember } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (!newMember) {
    return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
  }

  // Check if user is already in a team
  const { data: existingTeam } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", newMember.id)
    .maybeSingle();

  if (existingTeam) {
    return NextResponse.json(
      { error: "User is already a member of another team" },
      { status: 400 }
    );
  }

  // Add member to team
  const { error: addErr } = await supabase
    .from("team_members")
    .insert({ team_id: teamId, user_id: newMember.id });

  if (addErr) {
    if (addErr.code === "23505") {
      // Unique constraint violation
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: addErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, member: newMember });
}
