"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import { createSupabaseAdminClient } from "@/supabase/admin";

type ProductActionState = {
  ok: boolean;
  message: string;
};

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireRole(["admin"]);

  const name = sanitize(formData.get("name"));
  const description = sanitize(formData.get("description"));

  if (!name) {
    return { ok: false, message: "El nombre del producto es obligatorio." };
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("products").insert({
    name,
    description: description || null,
  });

  if (error) {
    return { ok: false, message: "No se pudo crear el producto. Verifica si el nombre ya existe." };
  }

  revalidatePath("/admin/products");

  return { ok: true, message: "Producto creado correctamente." };
}

export async function updateProductStatusAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireRole(["admin"]);

  const productId = sanitize(formData.get("product_id"));
  const active = formData.get("active") === "on";

  if (!productId) {
    return { ok: false, message: "Producto invalido." };
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("products")
    .update({ active })
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "No se pudo actualizar el producto." };
  }

  revalidatePath("/admin/products");

  return { ok: true, message: "Estado del producto actualizado." };
}
