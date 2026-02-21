"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { ROLE_DASHBOARDS, type Role } from "@/lib/role-utils";

export default function AuthRegisterPage() {
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
      
      console.log("[Register] Creating account...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { role: "student" },  // Only students can self-register
        },
      });

      if (authError) {
        console.error("[Register] Auth error:", authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error("[Register] No user returned from sign up");
        setError("Registration failed: no user data");
        setLoading(false);
        return;
      }

      const userId = authData.user.id;
      console.log(`[Register] ✓ User created. ID: ${userId.slice(0, 8)}...`);

      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;

      if (!sessionUserId) {
        console.error("[Register] ❌ No session after registration");
        setError("Failed to create session");
        setLoading(false);
        return;
      }

      console.log(`[Register] ✓ Session confirmed`);

      // Fetch role from database (public.profiles)
      console.log(`[Register] → Fetching role...`);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionUserId)
        .single();

      if (profileError) {
        console.error("[Register] ❌ Profile query error:", profileError.message);
        setError(`Profile error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.error("[Register] ❌ No profile created for new user");
        setError("Profile not created. Try again or contact admin.");
        setLoading(false);
        return;
      }

      const role = profileData.role as Role | null;
      
      if (!role) {
        console.error("[Register] ❌ Profile exists but role is NULL");
        setError("Your profile has no role. Contact admin.");
        setLoading(false);
        return;
      }

      console.log(`[Register] ✓ Role assigned: "${role}"`);

      // Redirect to appropriate dashboard
      const redirectPath = role === "student" ? "/student/dashboard" : "/dashboard";
      console.log(`[Register] → Redirecting to: ${redirectPath}`);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push(redirectPath);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed";
      console.error("[Register] Exception:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
        <h1 className="text-xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">Register as a student for Hackathon360</p>
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
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-black/20">
        <h1 className="text-xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">Register as a student for Hackathon360</p>
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
              minLength={6}
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
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
