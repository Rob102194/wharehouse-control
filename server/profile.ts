import { redirect } from "next/navigation";
import type { Role } from "@/types/domain";
import type { Profile } from "@/types/profile";
import { createSupabaseServerClient } from "@/supabase/server";
import { getCurrentUser } from "@/server/auth";

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }

  return data;
}

export async function requireActiveProfile() {
  const profile = await getCurrentProfile();

  if (!profile || !profile.active) {
    redirect("/login?error=sin_acceso");
  }

  return profile;
}

export async function requireRole(allowedRoles: Role[]) {
  const profile = await requireActiveProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect(getHomePathForRole(profile.role));
  }

  return profile;
}

export function getHomePathForRole(role: Role): string {
  if (role === "owner") {
    return "/stock";
  }

  return "/operations";
}
