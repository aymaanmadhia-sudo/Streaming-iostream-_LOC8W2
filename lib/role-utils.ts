/**
 * Centralized role management utilities
 * Single source of truth for role-fetching logic
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type Role = "student" | "judge" | "admin";

export const ROLE_DASHBOARDS: Record<Role, string> = {
  student: "/student",
  judge: "/judge",
  admin: "/admin",
};

/**
 * Fetch user role from public.profiles (source of truth)
 * DO NOT silently default to 'student' - throw error if missing
 */
export async function fetchUserRole(
  supabase: SupabaseClient,
  userId: string | undefined,
  context: string = "app"
): Promise<Role | null> {
  if (!userId) {
    console.log(`[${context}] No user ID provided`);
    return null;
  }

  try {
    console.log(`[${context}] Fetching role for user: ${userId}`);
    
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(
        `[${context}] ❌ PROFILE FETCH ERROR - This means the profile doesn't exist or is inaccessible:`,
        {
          code: profileError.code,
          message: profileError.message,
          userId: userId.slice(0, 8) + "...",
        }
      );
      console.warn(
        `[${context}] 🔧 FIX: Run SETUP_TEST_USERS.sql or create profile in Supabase UI → SQL Editor`
      );
      return null;
    }

    if (!profileData) {
      console.error(
        `[${context}] ❌ No profile found for user ${userId.slice(0, 8)}...`
      );
      console.warn(
        `[${context}] 🔧 FIX: Profile doesn't exist. Insert with: INSERT INTO public.profiles (id, email, role) VALUES ('${userId}', 'user@example.com', 'admin')`
      );
      return null;
    }

    const role = profileData.role as Role | undefined;
    if (!role) {
      console.error(
        `[${context}] ❌ Profile exists but role is NULL for user ${userId.slice(0, 8)}...`
      );
      console.warn(
        `[${context}] 🔧 FIX: Update profile with: UPDATE public.profiles SET role = 'admin' WHERE id = '${userId}'`
      );
      return null;
    }

    console.log(
      `[${context}] ✅ User role found: "${role}" for ${userId.slice(0, 8)}...`
    );
    return role;
  } catch (error) {
    console.error(`[${context}] Exception fetching role:`, error);
    return null;
  }
}

/**
 * Verify that user can access a specific route
 * Returns: { allowed: boolean, reason: string, redirectTo?: string }
 */
export function verifyRouteAccess(
  userRole: Role | null,
  routePath: string
): { allowed: boolean; reason: string; redirectTo?: string } {
  // No role = not authenticated
  if (!userRole) {
    return {
      allowed: false,
      reason: "No role found in profile",
      redirectTo: "/auth/login",
    };
  }

  // /admin routes - admin only
  if (routePath.startsWith("/admin")) {
    if (userRole === "admin") {
      return { allowed: true, reason: "Admin accessing /admin" };
    }
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot access /admin (admin only)`,
      redirectTo: ROLE_DASHBOARDS[userRole],
    };
  }

  // /judge routes - judge only
  if (routePath.startsWith("/judge")) {
    if (userRole === "judge") {
      return { allowed: true, reason: "Judge accessing /judge" };
    }
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot access /judge (judge only)`,
      redirectTo: ROLE_DASHBOARDS[userRole],
    };
  }

  // /student routes - student only (admin can access for testing)
  if (routePath.startsWith("/student") || routePath.startsWith("/submission")) {
    if (userRole === "student" || userRole === "admin") {
      return { allowed: true, reason: `${userRole} accessing ${routePath}` };
    }
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot access ${routePath} (student only)`,
      redirectTo: ROLE_DASHBOARDS[userRole],
    };
  }

  // /dashboard - admin only (confusing name)
  if (routePath.startsWith("/dashboard")) {
    if (userRole === "admin") {
      return { allowed: true, reason: "Admin accessing /dashboard" };
    }
    return {
      allowed: false,
      reason: `Role '${userRole}' cannot access /dashboard (admin only)`,
      redirectTo: ROLE_DASHBOARDS[userRole],
    };
  }

  return { allowed: true, reason: "Public route" };
}
