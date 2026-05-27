"use server";

import { requireRole } from "@/server/profile";
import { createAdjustment } from "@/server/movements";
import { revalidatePath } from "next/cache";

export async function quickStockAdjustmentAction(prevState: unknown, formData: FormData): Promise<{ ok: boolean; message: string }> {
  const roleCheck = await requireRole(["admin", "operator"]);
  if (!roleCheck) {
    return { ok: false, message: "No autorizado" };
  }

  const warehouseId = formData.get("warehouse_id") as string;
  const productVariantId = formData.get("product_variant_id") as string;
  const newStockRaw = formData.get("new_stock") as string;
  const reason = formData.get("reason") as string;

  if (!warehouseId || !productVariantId || !newStockRaw || !reason) {
    return { ok: false, message: "Faltan campos requeridos" };
  }

  const newStock = parseFloat(newStockRaw);
  if (isNaN(newStock) || newStock < 0) {
    return { ok: false, message: "Stock inválido" };
  }

  if (reason.trim().length < 3) {
    return { ok: false, message: "La razón debe tener al menos 3 caracteres" };
  }

  const { createSupabaseAdminClient } = await import("@/supabase/admin");
  const adminClient = createSupabaseAdminClient();

  const { data: currentStock, error: fetchError } = await adminClient
    .from("warehouse_stock")
    .select("stock")
    .eq("warehouse_id", warehouseId)
    .eq("product_variant_id", productVariantId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return { ok: false, message: "Error al obtener stock actual" };
  }

  const currentQty = currentStock?.stock ?? 0;
  const diff = newStock - currentQty;

  if (Math.abs(diff) < 0.001) {
    return { ok: true, message: "Stock sin cambios" };
  }

  const direction = diff > 0 ? "positive" : "negative";
  const absDiff = Math.abs(diff);

  const notes = direction === "positive"
    ? `Ajuste positivo: stock aumentó de ${currentQty.toFixed(3)} a ${newStock.toFixed(3)} (+${absDiff.toFixed(3)})`
    : `Ajuste negativo: stock disminuyó de ${currentQty.toFixed(3)} a ${newStock.toFixed(3)} (-${absDiff.toFixed(3)})`;

  try {
    await createAdjustment(
      warehouseId,
      roleCheck.id,
      direction,
      reason.trim(),
      [{ product_variant_id: productVariantId, quantity: absDiff }],
      notes,
    );

    revalidatePath("/stock");
    return { ok: true, message: "Stock ajustado correctamente" };
  } catch (error) {
    console.error("Adjustment error:", error);
    return { ok: false, message: error instanceof Error ? error.message : "Error al crear ajuste" };
  }
}