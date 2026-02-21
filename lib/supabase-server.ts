import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete?: (name: string) => void;
  remove?: (name: string) => void;
};

export function createServerSupabaseClient(cookieStore: CookieStore) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables not configured");
  }
  const remove = cookieStore.delete ?? cookieStore.remove;
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Ignore when not in request context
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          if (remove) remove(name);
        } catch {
          // Ignore
        }
      },
    },
  });
}

/** Get Supabase client for server components/actions (uses next/headers cookies). */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    get: (name) => cookieStore.get(name) ?? undefined,
    set: (name, value, options) => cookieStore.set(name, value, options),
    delete: (name) => cookieStore.delete(name),
  });
}
