import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    get: (name: string) => cookieStore.get(name) ?? undefined,
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieStore.set(name, value, options);
    },
    delete: (name: string) => cookieStore.delete(name),
  });
}

/**
 * POST: Log QR action (entry | food) for the current user. Inserts into qr_logs.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = body?.type === "entry" || body?.type === "food" ? body.type : null;
  if (!type) {
    return NextResponse.json(
      { error: "type must be 'entry' or 'food'" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("qr_logs").insert({
    user_id: user.id,
    type,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
