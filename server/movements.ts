import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Movement, TransferInTransit } from "@/types/movement";
import type { MovementRpcItemInput, TransferReceiptItemInput } from "@/types/movement-item";

function normalizeRpcError(message: string) {
  return message || "No se pudo completar la operacion de inventario.";
}

export async function createEntry(
  destinationWarehouseId: string,
  createdBy: string,
  items: MovementRpcItemInput[],
  notes?: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("create_entry", {
    p_destination_warehouse_id: destinationWarehouseId,
    p_created_by: createdBy,
    p_items: items,
    p_notes: notes?.trim() ? notes.trim() : null,
  });

  if (error || !data) {
    throw new Error(normalizeRpcError(error?.message ?? ""));
  }

  return data as string;
}

export async function createExit(
  originWarehouseId: string,
  createdBy: string,
  items: MovementRpcItemInput[],
  notes?: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("create_exit", {
    p_origin_warehouse_id: originWarehouseId,
    p_created_by: createdBy,
    p_items: items,
    p_notes: notes?.trim() ? notes.trim() : null,
  });

  if (error || !data) {
    throw new Error(normalizeRpcError(error?.message ?? ""));
  }

  return data as string;
}

export async function createTransfer(
  originWarehouseId: string,
  destinationWarehouseId: string,
  createdBy: string,
  items: MovementRpcItemInput[],
  notes?: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("create_transfer", {
    p_origin_warehouse_id: originWarehouseId,
    p_destination_warehouse_id: destinationWarehouseId,
    p_created_by: createdBy,
    p_items: items,
    p_notes: notes?.trim() ? notes.trim() : null,
  });

  if (error || !data) {
    throw new Error(normalizeRpcError(error?.message ?? ""));
  }

  return data as string;
}

export async function receiveTransfer(
  movementId: string,
  receivedBy: string,
  items: TransferReceiptItemInput[],
  incidentNote?: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("receive_transfer", {
    p_movement_id: movementId,
    p_received_by: receivedBy,
    p_items: items,
    p_incident_note: incidentNote?.trim() ? incidentNote.trim() : null,
  });

  if (error || !data) {
    throw new Error(normalizeRpcError(error?.message ?? ""));
  }

  return data as string;
}

export async function createAdjustment(
  warehouseId: string,
  createdBy: string,
  adjustmentDirection: "positive" | "negative",
  adjustmentReason: string,
  items: MovementRpcItemInput[],
  notes?: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient.rpc("create_adjustment", {
    p_warehouse_id: warehouseId,
    p_created_by: createdBy,
    p_adjustment_direction: adjustmentDirection,
    p_adjustment_reason: adjustmentReason,
    p_items: items,
    p_notes: notes?.trim() ? notes.trim() : null,
  });

  if (error || !data) {
    throw new Error(normalizeRpcError(error?.message ?? ""));
  }

  return data as string;
}

export async function listMovements(limit = 100): Promise<Movement[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("movements")
    .select(
      "id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, adjustment_reason, notes, incident_note, created_by, created_at, confirmed_at, received_by, received_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Movement[]>();

  if (error || !data) {
    return [];
  }

  return data;
}

export async function listTransfersInTransit(limit = 50): Promise<TransferInTransit[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("movements")
    .select("id, origin_warehouse_id, destination_warehouse_id, created_at, notes")
    .eq("movement_type", "transfer")
    .eq("status", "in_transit")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TransferInTransit[]>();

  if (error || !data) {
    return [];
  }

  return data;
}
