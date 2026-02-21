"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { ROLE_DASHBOARDS, type Role } from "@/lib/role-utils";

export default function AuthLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      
      console.log("[Login] Signing in...");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        console.error("[Login] Auth error:", authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error("[Login] No user returned from sign in");
        setError("Sign in failed: no user data");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      console.log(`[Login] Session user ID: ${userId}`);

      // Get session
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;

      if (!sessionUserId) {
        console.error("[Login] No session after sign in");
        setError("Failed to get session");
        setLoading(false);
        return;
      }

      console.log(`[Login] Session confirmed: ${sessionUserId}`);

      // Fetch role from public.users table
      console.log(`[Login] Fetching role...`);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", sessionUserId)
        .single();

      if (userError || !userData) {
        console.error("[Login] User fetch error:", userError?.message);
        setError("Could not fetch user role. Contact admin.");
        setLoading(false);
        return;
      }

      const role = userData.role;

      if (!role) {
        console.error("[Login] Role is null");
        setError("Your role is not set. Contact admin.");
        setLoading(false);
        return;
      }

      console.log(`[Login] Role fetched: ${role}`);

      let redirectPath = "/student/dashboard";
      if (role === "admin") {
        redirectPath = "/admin";
      } else if (role === "judge") {
        redirectPath = "/judge";
      } else if (role === "student") {
        redirectPath = "/student/dashboard";
      }

      console.log(`[Login] Redirecting to: ${redirectPath}`);
      router.push(redirectPath);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign in failed";
      console.error("[Login] Exception:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
        <h1 className="text-xl font-semibold tracking-tight text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Hackathon360 – Students, Judges & Admins</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2.5 text-white placeholder-gray-400 outline-none transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          No account?{" "}
          <Link href="/auth/register" className="font-medium text-cyan-400 hover:text-cyan-300">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
