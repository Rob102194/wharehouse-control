"use server";

import { createSupabaseAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import type { MovementRpcItemInput } from "@/types/movement-item";

export type EditActionState = {
  ok: boolean;
  message: string;
  newMovementId?: string;
};

export async function editMovementWithCompensationAction(
  prevState: unknown,
  formData: FormData,
): Promise<EditActionState> {
  const roleCheck = await requireRole(["admin", "operator"]);
  if (!roleCheck) {
    return { ok: false, message: "No autorizado" };
  }

  const movementId = formData.get("movement_id") as string;
  const originWarehouseId = formData.get("origin_warehouse_id") as string;
  const destinationWarehouseId = formData.get("destination_warehouse_id") as string;
  const notes = formData.get("notes") as string;
  const adjustmentReason = formData.get("adjustment_reason") as string;
  const editReason = formData.get("edit_reason") as string;
  const itemsJson = formData.get("items_json") as string;

  if (!movementId) {
    return { ok: false, message: "ID de movimiento requerido" };
  }

  if (!editReason || editReason.trim().length < 3) {
    return { ok: false, message: "Razón de edición obligatoria (mínimo 3 caracteres)" };
  }

  let items: Array<{ product_variant_id: string; quantity: number }>;
  try {
    items = JSON.parse(itemsJson || "[]");
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, message: "Al menos un producto requerido" };
    }
  } catch {
    return { ok: false, message: "Formato de items inválido" };
  }

  const invalidItems = items.filter(
    (i) => !i.product_variant_id || !i.quantity || i.quantity <= 0
  );
  if (invalidItems.length > 0) {
    return { ok: false, message: "Items con datos inválidos" };
  }

  const productIds = items.map((i) => i.product_variant_id);
  const uniqueProductIds = new Set(productIds);
  if (uniqueProductIds.size !== productIds.length) {
    return { ok: false, message: "No se pueden duplicar productos en el movimiento" };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: variants } = await adminClient
    .from("product_variants")
    .select("id, active")
    .in("id", productIds);

  const inactiveVariants = variants?.filter((v) => !v.active).map((v) => v.id) ?? [];
  if (inactiveVariants.length > 0) {
    return { ok: false, message: "Algunos productos están inactivos" };
  }

  const { data: movement, error: fetchError } = await adminClient
    .from("movements")
    .select("id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, adjustment_reason, notes, incident_note, edit_history")
    .eq("id", movementId)
    .single();

  if (fetchError || !movement) {
    return { ok: false, message: "Movimiento no encontrado" };
  }

  const existingEditHistory = (movement.edit_history as Record<string, unknown>[]) ?? [];
  const isDeleted = existingEditHistory.some(entry => entry.deleted === true);
  if (isDeleted) {
    return { ok: false, message: "No se puede editar un movimiento eliminado" };
  }

  const isModified = existingEditHistory.some(entry => entry.new_movement_id !== undefined && entry.new_movement_id !== null);
  if (isModified) {
    return { ok: false, message: "No se puede editar un movimiento que ya ha sido modificado y reemplazado" };
  }

  if (movement.movement_type === "transfer" && originWarehouseId === destinationWarehouseId) {
    return { ok: false, message: "Origen y destino deben ser diferentes" };
  }

  const rpcItems: MovementRpcItemInput[] = items.map((item) => ({
    product_variant_id: item.product_variant_id,
    quantity: item.quantity,
  }));

  let compensationId = "";
  try {
    const { data: compData, error: compError } = await adminClient.rpc("get_compensation_id", {
      p_movement_id: movement.id,
      p_items: items,
      p_created_by: roleCheck.id,
    });

    if (!compError && compData) {
      compensationId = compData;
    } else {
      const compItems = items.map((i) => ({ product_variant_id: i.product_variant_id, quantity: i.quantity }));
      const tempItems: MovementRpcItemInput[] = compItems.map((i) => ({ product_variant_id: i.product_variant_id, quantity: i.quantity }));

      if (movement.movement_type === "entry" && movement.origin_warehouse_id) {
        const { data } = await adminClient.rpc("create_exit", {
          p_origin_warehouse_id: movement.origin_warehouse_id,
          p_created_by: roleCheck.id,
          p_items: tempItems,
          p_notes: `Compensación por edición de movimiento ${movement.id}`,
          p_allow_negative: true,
        });
        compensationId = data ?? "";
      } else if (movement.movement_type === "exit" && movement.origin_warehouse_id) {
        const { data } = await adminClient.rpc("create_entry", {
          p_destination_warehouse_id: movement.origin_warehouse_id,
          p_created_by: roleCheck.id,
          p_items: tempItems,
          p_notes: `Compensación por edición de movimiento ${movement.id}`,
        });
        compensationId = data ?? "";
      } else if (movement.movement_type === "transfer" && movement.origin_warehouse_id && movement.destination_warehouse_id) {
        const { data } = await adminClient.rpc("create_transfer", {
          p_origin_warehouse_id: movement.destination_warehouse_id,
          p_destination_warehouse_id: movement.origin_warehouse_id,
          p_created_by: roleCheck.id,
          p_items: tempItems,
          p_notes: `Compensación por edición de movimiento ${movement.id}`,
          p_allow_negative: true,
        });
        compensationId = data ?? "";
      } else if (movement.movement_type === "adjustment" && movement.origin_warehouse_id) {
        const direction = movement.adjustment_direction === "positive" ? "negative" : "positive";
        const { data } = await adminClient.rpc("create_adjustment", {
          p_warehouse_id: movement.origin_warehouse_id,
          p_created_by: roleCheck.id,
          p_adjustment_direction: direction,
          p_adjustment_reason: `Compensación por edición de movimiento ${movement.id}`,
          p_items: tempItems,
          p_notes: `Compensación por edición de movimiento ${movement.id}`,
        });
        compensationId = data ?? "";
      }
    }
  } catch (compError) {
    console.error("Compensation error:", compError);
    return { ok: false, message: "Error al crear movimiento de compensación" };
  }

  if (compensationId) {
    const { error: markError } = await adminClient
      .from("movements")
      .update({ is_compensation: true })
      .eq("id", compensationId);
    if (markError) {
      console.error("Error marking compensation movement:", markError);
    }
  }

  let newMovementId = "";
  try {
    if (movement.movement_type === "entry") {
      if (!originWarehouseId) {
        return { ok: false, message: "Almacén de destino requerido" };
      }
      const { data } = await adminClient.rpc("create_entry", {
        p_destination_warehouse_id: originWarehouseId,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: notes || null,
      });
      newMovementId = data ?? "";
    } else if (movement.movement_type === "exit") {
      if (!originWarehouseId) {
        return { ok: false, message: "Almacén de origen requerido" };
      }
      const { data } = await adminClient.rpc("create_exit", {
        p_origin_warehouse_id: originWarehouseId,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: notes || null,
        p_allow_negative: true,
      });
      newMovementId = data ?? "";
    } else if (movement.movement_type === "transfer") {
      if (!originWarehouseId || !destinationWarehouseId) {
        return { ok: false, message: "Almacenes de origen y destino requeridos" };
      }
      const { data } = await adminClient.rpc("create_transfer", {
        p_origin_warehouse_id: originWarehouseId,
        p_destination_warehouse_id: destinationWarehouseId,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: notes || null,
        p_allow_negative: true,
      });
      newMovementId = data ?? "";
    } else if (movement.movement_type === "adjustment") {
      if (!originWarehouseId) {
        return { ok: false, message: "Almacén requerido" };
      }
      const direction = formData.get("adjustment_direction") as string;
      const { data } = await adminClient.rpc("create_adjustment", {
        p_warehouse_id: originWarehouseId,
        p_created_by: roleCheck.id,
        p_adjustment_direction: direction || "positive",
        p_adjustment_reason: adjustmentReason || editReason,
        p_items: rpcItems,
        p_notes: notes || null,
      });
      newMovementId = data ?? "";
    }
  } catch (newError) {
    console.error("New movement error:", newError);
    return { ok: false, message: "Error al crear nuevo movimiento" };
  }

  if (!newMovementId) {
    return { ok: false, message: "No se pudo crear el nuevo movimiento" };
  }

  const newEditEntry = {
    edited_at: new Date().toISOString(),
    edit_reason: editReason.trim(),
    original_movement_id: movement.id,
    compensation_movement_id: compensationId,
    new_movement_id: newMovementId,
    previous_origin: movement.origin_warehouse_id,
    previous_destination: movement.destination_warehouse_id,
    previous_notes: movement.notes,
    previous_adjustment_reason: movement.adjustment_reason,
  };

  const { error: updateError } = await adminClient
    .from("movements")
    .update({
      edit_history: [...existingEditHistory, newEditEntry],
    })
    .eq("id", movement.id);

  if (updateError) {
    console.error("Update history error:", updateError);
  }

  revalidatePath("/history");
  revalidatePath("/stock");

  return { ok: true, message: "Movimiento actualizado correctamente", newMovementId };
}

export async function deleteMovementWithCompensationAction(
  prevState: unknown,
  formData: FormData,
): Promise<EditActionState> {
  const roleCheck = await requireRole(["admin", "operator"]);
  if (!roleCheck) {
    return { ok: false, message: "No autorizado" };
  }

  const movementId = formData.get("movement_id") as string;
  const deleteReason = formData.get("delete_reason") as string;

  if (!movementId) {
    return { ok: false, message: "ID de movimiento requerido" };
  }

  if (!deleteReason || deleteReason.trim().length < 3) {
    return { ok: false, message: "Razón de eliminación obligatoria (mínimo 3 caracteres)" };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: movement, error: fetchError } = await adminClient
    .from("movements")
    .select("id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, edit_history")
    .eq("id", movementId)
    .single();

  if (fetchError || !movement) {
    return { ok: false, message: "Movimiento no encontrado" };
  }

  const existingEditHistory = (movement.edit_history as Record<string, unknown>[]) ?? [];
  const isDeleted = existingEditHistory.some(entry => entry.deleted === true);
  if (isDeleted) {
    return { ok: false, message: "Este movimiento ya fue eliminado previamente" };
  }

  const isModified = existingEditHistory.some(entry => entry.new_movement_id !== undefined && entry.new_movement_id !== null);
  if (isModified) {
    return { ok: false, message: "No se puede eliminar un movimiento que ya ha sido modificado y reemplazado" };
  }

  const { data: items, error: itemsError } = await adminClient
    .from("movement_items")
    .select("product_variant_id, quantity")
    .eq("movement_id", movementId)
    .returns<{ product_variant_id: string; quantity: number }[]>();

  if (itemsError || !items || items.length === 0) {
    return { ok: false, message: "El movimiento no tiene items" };
  }

  const rpcItems: MovementRpcItemInput[] = items.map((item) => ({
    product_variant_id: item.product_variant_id,
    quantity: item.quantity,
  }));

  let compensationId = "";

  try {
    if (movement.movement_type === "entry" && movement.origin_warehouse_id) {
      const { data } = await adminClient.rpc("create_exit", {
        p_origin_warehouse_id: movement.origin_warehouse_id,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: `Eliminación de movimiento ${movement.id}`,
        p_allow_negative: true,
      });
      compensationId = data ?? "";
    } else if (movement.movement_type === "exit" && movement.origin_warehouse_id) {
      const { data } = await adminClient.rpc("create_entry", {
        p_destination_warehouse_id: movement.origin_warehouse_id,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: `Eliminación de movimiento ${movement.id}`,
      });
      compensationId = data ?? "";
    } else if (movement.movement_type === "transfer" && movement.origin_warehouse_id && movement.destination_warehouse_id) {
      const { data } = await adminClient.rpc("create_transfer", {
        p_origin_warehouse_id: movement.destination_warehouse_id,
        p_destination_warehouse_id: movement.origin_warehouse_id,
        p_created_by: roleCheck.id,
        p_items: rpcItems,
        p_notes: `Eliminación de movimiento ${movement.id}`,
        p_allow_negative: true,
      });
      compensationId = data ?? "";
    } else if (movement.movement_type === "adjustment" && movement.origin_warehouse_id) {
      const direction = movement.adjustment_direction === "positive" ? "negative" : "positive";
      const { data } = await adminClient.rpc("create_adjustment", {
        p_warehouse_id: movement.origin_warehouse_id,
        p_created_by: roleCheck.id,
        p_adjustment_direction: direction,
        p_adjustment_reason: `Eliminación de movimiento ${movement.id}`,
        p_items: rpcItems,
        p_notes: `Eliminación de movimiento ${movement.id}`,
      });
      compensationId = data ?? "";
    } else {
      return { ok: false, message: "Tipo de movimiento no soportado para eliminación" };
    }
  } catch (compError) {
    console.error("Compensation error:", compError);
    return { ok: false, message: "Error al crear movimiento de compensación" };
  }

  if (compensationId) {
    const { error: markError } = await adminClient
      .from("movements")
      .update({ is_compensation: true })
      .eq("id", compensationId);
    if (markError) {
      console.error("Error marking compensation movement:", markError);
    }
  }

  if (!compensationId) {
    return { ok: false, message: "No se pudo crear el movimiento de compensación" };
  }

  const deleteEntry = {
    deleted_at: new Date().toISOString(),
    deleted_by: roleCheck.id,
    delete_reason: deleteReason.trim(),
    compensation_movement_id: compensationId,
    deleted: true,
  };

  const { error: updateError } = await adminClient
    .from("movements")
    .update({
      edit_history: [...existingEditHistory, deleteEntry],
    })
    .eq("id", movementId);

  if (updateError) {
    console.error("Update delete error:", updateError);
    return { ok: false, message: "Error al marcar movimiento como eliminado" };
  }

  revalidatePath("/history");
  revalidatePath("/stock");

  return { ok: true, message: "Operación eliminada correctamente" };
}