"use server";

import { redirect } from "next/navigation";
import { getHomePathForRole } from "@/server/profile";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { createSupabaseServerActionClient } from "@/supabase/server-action";
import type { Role } from "@/types/domain";

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Credenciales invalidas" };
  }

  const adminClient = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("email, role, active")
    .eq("username", username)
    .maybeSingle<{ email: string | null; role: Role; active: boolean }>();

  if (profileError || !profile || !profile.active || !profile.email) {
    return { error: "Credenciales invalidas" };
  }

  const supabase = await createSupabaseServerActionClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (signInError) {
    return { error: "Credenciales invalidas" };
  }

  redirect(getHomePathForRole(profile.role));
}
