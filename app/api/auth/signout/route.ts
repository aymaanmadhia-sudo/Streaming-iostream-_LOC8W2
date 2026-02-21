import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
  await supabase.auth.signOut();
  const url = new URL("/student/login", request.nextUrl.origin);
  return NextResponse.redirect(url, 302);
}
