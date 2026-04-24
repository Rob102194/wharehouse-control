"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import { createSupabaseAdminClient } from "@/supabase/admin";

type ProductVariantActionState = {
  ok: boolean;
  message: string;
};

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createProductVariantAction(
  _prevState: ProductVariantActionState,
  formData: FormData,
): Promise<ProductVariantActionState> {
  await requireRole(["admin"]);

  const productId = sanitize(formData.get("product_id"));
  const name = sanitize(formData.get("name"));
  const sku = sanitize(formData.get("sku"));
  const presentation = sanitize(formData.get("presentation"));
  const unitName = sanitize(formData.get("unit_name"));

  if (!productId || !name) {
    return { ok: false, message: "Producto base y nombre de variante son obligatorios." };
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("product_variants").insert({
    product_id: productId,
    name,
    sku: sku || null,
    presentation: presentation || null,
    unit_name: unitName || null,
  });

  if (error) {
    return {
      ok: false,
      message: "No se pudo crear la variante. Verifica duplicados de nombre por producto o SKU.",
    };
  }

  revalidatePath("/admin/product-variants");

  return { ok: true, message: "Variante creada correctamente." };
}

export async function updateProductVariantStatusAction(
  _prevState: ProductVariantActionState,
  formData: FormData,
): Promise<ProductVariantActionState> {
  await requireRole(["admin"]);

  const variantId = sanitize(formData.get("variant_id"));
  const active = formData.get("active") === "on";

  if (!variantId) {
    return { ok: false, message: "Variante invalida." };
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("product_variants")
    .update({ active })
    .eq("id", variantId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "No se pudo actualizar la variante." };
  }

  revalidatePath("/admin/product-variants");

  return { ok: true, message: "Estado de la variante actualizado." };
}
