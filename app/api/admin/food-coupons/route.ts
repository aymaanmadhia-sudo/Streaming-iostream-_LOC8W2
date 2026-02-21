import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const count = typeof body?.count === "number" ? Math.min(50, Math.max(1, body.count)) : 5;

  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    get: (name) => cookieStore.get(name) ?? undefined,
    set: (name, value, options) => cookieStore.set(name, value, options),
    delete: (name) => cookieStore.delete(name),
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = Array.from({ length: count }, (_, i) => ({
    code: `FC-${Date.now().toString(36).toUpperCase()}-${(i + 1).toString().padStart(2, "0")}`,
  }));

  const { error } = await supabase.from("food_coupons").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count });
}
