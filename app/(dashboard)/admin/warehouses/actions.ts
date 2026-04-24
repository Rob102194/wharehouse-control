"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import { createSupabaseAdminClient } from "@/supabase/admin";

type WarehouseActionState = {
  ok: boolean;
  message: string;
};

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createWarehouseAction(
  _prevState: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  await requireRole(["admin"]);

  const code = sanitize(formData.get("code")).toUpperCase();
  const name = sanitize(formData.get("name"));

  if (!code || !name) {
    return { ok: false, message: "Codigo y nombre son obligatorios." };
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("warehouses").insert({
    code,
    name,
  });

  if (error) {
    return { ok: false, message: "No se pudo crear el almacen. Verifica duplicados de codigo o nombre." };
  }

  revalidatePath("/admin/warehouses");

  return { ok: true, message: "Almacen creado correctamente." };
}

export async function updateWarehouseStatusAction(
  _prevState: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  await requireRole(["admin"]);

  const warehouseId = sanitize(formData.get("warehouse_id"));
  const active = formData.get("active") === "on";

  if (!warehouseId) {
    return { ok: false, message: "Almacen invalido." };
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("warehouses")
    .update({ active })
    .eq("id", warehouseId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "No se pudo actualizar el almacen." };
  }

  revalidatePath("/admin/warehouses");

  return { ok: true, message: "Estado de almacen actualizado." };
}
