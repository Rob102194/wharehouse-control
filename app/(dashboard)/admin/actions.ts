"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { requireRole } from "@/server/profile";
import type { Role } from "@/types/domain";

type CreateUserResult = {
  ok: boolean;
  message: string;
};

type UpdateUserResult = {
  ok: boolean;
  message: string;
};

const allowedRoles: Role[] = ["operator", "admin", "owner"];

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isValidRole(value: string): value is Role {
  return allowedRoles.includes(value as Role);
}

export async function createInternalUserAction(
  _prevState: CreateUserResult,
  formData: FormData,
): Promise<CreateUserResult> {
  await requireRole(["admin"]);

  const username = sanitize(formData.get("username"));
  const email = sanitize(formData.get("email")).toLowerCase();
  const fullName = sanitize(formData.get("full_name"));
  const password = String(formData.get("password") ?? "");
  const role = sanitize(formData.get("role"));
  const active = formData.get("active") === "on";

  if (!username || !email || !password || !isValidRole(role)) {
    return { ok: false, message: "Completa todos los campos obligatorios." };
  }

  if (password.length < 8) {
    return { ok: false, message: "La contrasena debe tener al menos 8 caracteres." };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: authResult, error: createAuthError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createAuthError || !authResult.user) {
    return { ok: false, message: "No se pudo crear el usuario en Auth." };
  }

  const { error: insertProfileError } = await adminClient.from("profiles").insert({
    id: authResult.user.id,
    username,
    email,
    full_name: fullName || null,
    role,
    active,
  });

  if (insertProfileError) {
    await adminClient.auth.admin.deleteUser(authResult.user.id);
    return { ok: false, message: "No se pudo crear el perfil. Se revirtio el usuario de Auth." };
  }

  revalidatePath("/admin");

  return { ok: true, message: "Usuario interno creado correctamente." };
}

export async function updateInternalUserAction(
  _prevState: UpdateUserResult,
  formData: FormData,
): Promise<UpdateUserResult> {
  const actor = await requireRole(["admin"]);
  const userId = sanitize(formData.get("user_id"));
  const role = sanitize(formData.get("role"));
  const active = formData.get("active") === "on";

  if (!userId || !isValidRole(role)) {
    return { ok: false, message: "Datos invalidos para actualizar el usuario." };
  }

  if (userId === actor.id && (role !== "admin" || !active)) {
    return {
      ok: false,
      message: "No puedes desactivarte ni quitarte el rol admin desde tu propia sesion.",
    };
  }

  const adminClient = createSupabaseAdminClient();
  const { data: updatedProfile, error: updateProfileError } = await adminClient
    .from("profiles")
    .update({ role, active })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (updateProfileError || !updatedProfile) {
    return { ok: false, message: "No se pudo actualizar el perfil." };
  }

  revalidatePath("/admin");

  return { ok: true, message: "Usuario actualizado correctamente." };
}
