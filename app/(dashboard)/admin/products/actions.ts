"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import { createSupabaseAdminClient } from "@/supabase/admin";

type ProductActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function sanitizeNumeric(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireRole(["admin"]);

  const name = sanitize(formData.get("name"));
  const description = sanitize(formData.get("description"));
  const isMeasurable = formData.get("is_measurable") !== "false";

  if (!name) {
    return { ok: false, message: "El nombre del producto es obligatorio." };
  }

  const adminClient = createSupabaseAdminClient();
  const { error } = await adminClient.from("products").insert({
    name,
    description: description || null,
    is_measurable: isMeasurable,
  });

  if (error) {
    return { ok: false, message: "No se pudo crear el producto. Verifica si el nombre ya existe." };
  }

  revalidatePath("/admin/products");

  return { ok: true, message: "Producto creado correctamente." };
}

export async function createProductWithVariantAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireRole(["admin"]);

  const adminClient = createSupabaseAdminClient();

  const name = sanitize(formData.get("name"));
  const description = sanitize(formData.get("description"));
  const isMeasurable = formData.get("is_measurable") !== "false";

  const variantName = sanitize(formData.get("variant_name"));
  const variantSku = sanitize(formData.get("variant_sku"));
  const variantUnitName = sanitize(formData.get("variant_unit_name"));
  const secondaryUnit = sanitize(formData.get("secondary_unit"));
  const secondaryQuantity = sanitizeNumeric(formData.get("secondary_quantity"));

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "El nombre del producto es obligatorio.";
  }

  if (!variantName) {
    errors.variant_name = "El nombre de la variante es obligatorio.";
  }

  if (isMeasurable && !secondaryUnit) {
    errors.secondary_unit = "Para productos medibles, la segunda unidad es obligatoria.";
  }

  if (isMeasurable && secondaryQuantity === null) {
    errors.secondary_quantity = "La cantidad de segunda unidad es obligatoria.";
  }

  if (secondaryQuantity !== null && secondaryQuantity <= 0) {
    errors.secondary_quantity = "La cantidad debe ser mayor a cero.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Corrige los errores.", errors };
  }

  const { data: productData, error: productError } = await adminClient
    .from("products")
    .insert({
      name,
      description: description || null,
      is_measurable: isMeasurable,
    })
    .select("id")
    .single();

  if (productError || !productData) {
    return { ok: false, message: "No se pudo crear el producto. Verifica si el nombre ya existe." };
  }

  const { error: variantError } = await adminClient.from("product_variants").insert({
    product_id: productData.id,
    name: variantName,
    sku: variantSku || null,
    unit_name: variantUnitName || null,
    secondary_unit: isMeasurable ? secondaryUnit : null,
    secondary_quantity: isMeasurable ? secondaryQuantity : null,
  });

  if (variantError) {
    await adminClient.from("products").delete().eq("id", productData.id);
    return { ok: false, message: "No se pudo crear la variante." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/product-variants");

  return { ok: true, message: "Mercancía creada correctamente." };
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
