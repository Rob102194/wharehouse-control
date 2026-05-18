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

function sanitizeNumeric(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

async function checkProductIsMeasurable(productId: string): Promise<boolean> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("products")
    .select("is_measurable")
    .eq("id", productId)
    .returns<{ is_measurable: boolean }[]>();

  if (error || !data || data.length === 0) {
    return true;
  }
  return data[0].is_measurable;
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
  const secondaryUnit = sanitize(formData.get("secondary_unit"));
  const secondaryQuantity = sanitizeNumeric(formData.get("secondary_quantity"));

  if (!productId || !name) {
    return { ok: false, message: "Producto base y nombre de variante son obligatorios." };
  }

  const isMeasurable = await checkProductIsMeasurable(productId);

  if (isMeasurable && !secondaryUnit) {
    return {
      ok: false,
      message: "Para productos medibles, la segunda unidad (kg/lt) es obligatoria.",
    };
  }

  if (isMeasurable && secondaryQuantity === null) {
    return {
      ok: false,
      message: "Para productos medibles, la cantidad en segunda unidad es obligatoria.",
    };
  }

  if (secondaryQuantity !== null && secondaryQuantity <= 0) {
    return { ok: false, message: "La cantidad debe ser mayor a cero." };
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("product_variants").insert({
    product_id: productId,
    name,
    sku: sku || null,
    presentation: presentation || null,
    unit_name: unitName || null,
    secondary_unit: secondaryUnit || null,
    secondary_quantity: secondaryQuantity,
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
