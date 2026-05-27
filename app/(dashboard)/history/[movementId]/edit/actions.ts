"use server";

import { createSupabaseAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateMovementAction(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const movementId = formData.get("movement_id") as string;
  const originalCreatedAt = formData.get("original_created_at") as string;
  const notes = formData.get("notes") as string;
  const adjustmentReason = formData.get("adjustment_reason") as string;
  const incidentNote = formData.get("incident_note") as string;
  const editReason = formData.get("edit_reason") as string;

  if (!movementId || !originalCreatedAt || !editReason) {
    return { ok: false, message: "Faltan campos requeridos" };
  }

  if (editReason.trim().length < 3) {
    return { ok: false, message: "La razón de edición debe tener al menos 3 caracteres" };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: movement, error: fetchError } = await adminClient
    .from("movements")
    .select("id, notes, adjustment_reason, incident_note, edit_history")
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

  const newEditEntry = {
    edited_at: new Date().toISOString(),
    previous_notes: movement.notes,
    previous_adjustment_reason: movement.adjustment_reason,
    previous_incident_note: movement.incident_note,
    edit_reason: editReason.trim(),
  };

  const updatedHistory = [...existingEditHistory, newEditEntry];

  const { error: updateError } = await adminClient
    .from("movements")
    .update({
      notes: notes?.trim() || null,
      adjustment_reason: adjustmentReason?.trim() || null,
      incident_note: incidentNote?.trim() || null,
      edit_history: updatedHistory,
    })
    .eq("id", movementId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { ok: false, message: "Error al actualizar el movimiento" };
  }

  revalidatePath("/history");
  revalidatePath(`/history/${movementId}/edit`);

  return { ok: true, message: "Movimiento actualizado correctamente" };
}