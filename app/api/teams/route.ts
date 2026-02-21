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
 * GET: Get user's team (if any)
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is member of a team
  const { data: membershipData, error: memberErr } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr && memberErr.code !== "PGRST116") {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  if (!membershipData) {
    return NextResponse.json(null);
  }

  // Get team details
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .select("id, team_name, leader_id, created_at")
    .eq("id", membershipData.team_id)
    .single();

  if (teamErr) {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  // Get team members
  const { data: members, error: membersErr } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", team.id);

  if (membersErr) {
    return NextResponse.json({ error: membersErr.message }, { status: 500 });
  }

  // Get user details for members
  const memberIds = members?.map((m) => m.user_id) || [];
  const { data: memberUsers } = memberIds.length
    ? await supabase.from("users").select("id, name, email").in("id", memberIds)
    : { data: [] };

  return NextResponse.json({
    ...team,
    members: memberUsers || [],
    isLeader: team.leader_id === user.id,
  });
}

/**
 * POST: Create a new team (user becomes leader)
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { team_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const team_name = typeof body?.team_name === "string" ? body.team_name.trim() : "";

  if (!team_name) {
    return NextResponse.json({ error: "team_name is required" }, { status: 400 });
  }

  // Check if user already in a team
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a member of a team" },
      { status: 400 }
    );
  }

  // Create team
  const { data: team, error: teamErr } = await supabase
    .from("teams")
    .insert({ team_name, leader_id: user.id })
    .select()
    .single();

  if (teamErr) {
    return NextResponse.json({ error: teamErr.message }, { status: 500 });
  }

  // Add leader as member
  const { error: memberErr } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });

  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ...team,
    members: [{ id: user.id, name: "", email: "" }],
    isLeader: true,
  });
}
