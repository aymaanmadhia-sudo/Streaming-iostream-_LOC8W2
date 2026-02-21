import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip if missing env vars
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[Middleware] Missing Supabase config");
    return NextResponse.next();
  }

  // Check if auth route
  const isAuthRoute = path === "/auth/login" || path === "/auth/register";
  
  // Check if protected route (needs session)
  const isProtectedRoute =
    path.startsWith("/admin") ||
    path.startsWith("/judge") ||
    path.startsWith("/student") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/submission");

  // Build response to collect cookie updates
  let response = NextResponse.next({ request });

  // Create Supabase client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Get session
  const { data: { session } } = await supabase.auth.getSession();

  // SIMPLE LOGIC:
  // - No session + protected route → send to login
  // - Session exists → allow through
  // - Auth routes → always allow (login/register handle redirects)
  // NO role checking here - roles are handled in login and pages

  if (!session && isProtectedRoute) {
    console.log(`[Middleware] No session for ${path} → redirect to login`);
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists or auth route - allow through
  return response;
}

export const config = {
  matcher: [
    "/auth/login",
    "/auth/register",
    "/admin/:path*",
    "/judge/:path*",
    "/student/:path*",
    "/dashboard/:path*",
    "/submission/:path*",
  ],
};
