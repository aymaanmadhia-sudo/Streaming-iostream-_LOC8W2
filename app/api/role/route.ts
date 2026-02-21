import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

type Role = "student" | "judge" | "admin";

/**
 * GET: Return the current user's role from profiles. Requires auth.
 */
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient({
    get: (name: string) => cookieStore.get(name) ?? undefined,
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieStore.set(name, value, options);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as Role) ?? "student";
  return NextResponse.json({ role });
}
