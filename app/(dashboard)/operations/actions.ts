"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import {
  createAdjustment,
  createEntry,
  createExit,
  createTransfer,
  receiveTransfer,
} from "@/server/movements";
import type { AdjustmentDirection } from "@/types/domain";
import type { MovementRpcItemInput, TransferReceiptItemInput } from "@/types/movement-item";

export type OperationActionState = {
  ok: boolean;
  message: string;
};

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseMovementItems(rawItems: string): MovementRpcItemInput[] {
  const parsed = JSON.parse(rawItems) as MovementRpcItemInput[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Debes incluir al menos una linea en items.");
  }

  const normalized = parsed.map((item) => ({
    product_variant_id: String(item.product_variant_id ?? "").trim(),
    quantity: Number(item.quantity),
  }));

  if (normalized.some((item) => !item.product_variant_id || Number.isNaN(item.quantity) || item.quantity <= 0)) {
    throw new Error("Items invalidos. Usa product_variant_id y quantity > 0.");
  }

  return normalized;
}

function parseReceiptItems(rawItems: string): TransferReceiptItemInput[] {
  const parsed = JSON.parse(rawItems) as TransferReceiptItemInput[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Debes incluir al menos una linea en recepcion.");
  }

  const normalized = parsed.map((item) => ({
    product_variant_id: String(item.product_variant_id ?? "").trim(),
    received_quantity: Number(item.received_quantity),
  }));

  if (
    normalized.some(
      (item) => !item.product_variant_id || Number.isNaN(item.received_quantity) || item.received_quantity < 0,
    )
  ) {
    throw new Error("Items de recepcion invalidos. Usa product_variant_id y received_quantity >= 0.");
  }

  return normalized;
}

function revalidateOperationalViews() {
  revalidatePath("/operations");
  revalidatePath("/history");
  revalidatePath("/stock");
}

export async function createEntryAction(_prev: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const destinationWarehouseId = sanitize(formData.get("destination_warehouse_id"));
    const notes = sanitize(formData.get("notes"));
    const items = parseMovementItems(sanitize(formData.get("items_json")));

    if (!destinationWarehouseId) {
      return { ok: false, message: "Debes seleccionar almacen destino." };
    }

    const movementId = await createEntry(destinationWarehouseId, actor.id, items, notes);
    revalidateOperationalViews();

    return { ok: true, message: `Entrada creada (${movementId}).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear la entrada." };
  }
}

export async function createExitAction(_prev: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const originWarehouseId = sanitize(formData.get("origin_warehouse_id"));
    const notes = sanitize(formData.get("notes"));
    const items = parseMovementItems(sanitize(formData.get("items_json")));

    if (!originWarehouseId) {
      return { ok: false, message: "Debes seleccionar almacen origen." };
    }

    const movementId = await createExit(originWarehouseId, actor.id, items, notes);
    revalidateOperationalViews();

    return { ok: true, message: `Salida creada (${movementId}).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear la salida." };
  }
}

export async function createTransferAction(
  _prev: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const originWarehouseId = sanitize(formData.get("origin_warehouse_id"));
    const destinationWarehouseId = sanitize(formData.get("destination_warehouse_id"));
    const notes = sanitize(formData.get("notes"));
    const items = parseMovementItems(sanitize(formData.get("items_json")));

    if (!originWarehouseId || !destinationWarehouseId) {
      return { ok: false, message: "Debes seleccionar almacen origen y destino." };
    }

    const movementId = await createTransfer(originWarehouseId, destinationWarehouseId, actor.id, items, notes);
    revalidateOperationalViews();

    return { ok: true, message: `Transferencia creada (${movementId}).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear la transferencia." };
  }
}

export async function receiveTransferAction(
  _prev: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const movementId = sanitize(formData.get("movement_id"));
    const incidentNote = sanitize(formData.get("incident_note"));
    const items = parseReceiptItems(sanitize(formData.get("items_json")));

    if (!movementId) {
      return { ok: false, message: "Debes indicar el id de transferencia en transito." };
    }

    const receivedMovementId = await receiveTransfer(movementId, actor.id, items, incidentNote);
    revalidateOperationalViews();

    return { ok: true, message: `Transferencia recibida (${receivedMovementId}).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo confirmar la recepcion." };
  }
}

export async function createAdjustmentAction(
  _prev: OperationActionState,
  formData: FormData,
): Promise<OperationActionState> {
  const actor = await requireRole(["admin"]);

  try {
    const warehouseId = sanitize(formData.get("warehouse_id"));
    const direction = sanitize(formData.get("adjustment_direction")) as AdjustmentDirection;
    const reason = sanitize(formData.get("adjustment_reason"));
    const notes = sanitize(formData.get("notes"));
    const items = parseMovementItems(sanitize(formData.get("items_json")));

    if (!warehouseId) {
      return { ok: false, message: "Debes seleccionar almacen del ajuste." };
    }

    if (direction !== "positive" && direction !== "negative") {
      return { ok: false, message: "Direccion de ajuste invalida." };
    }

    if (!reason) {
      return { ok: false, message: "La razon del ajuste es obligatoria." };
    }

    const movementId = await createAdjustment(warehouseId, actor.id, direction, reason, items, notes);
    revalidateOperationalViews();

    return { ok: true, message: `Ajuste creado (${movementId}).` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear el ajuste." };
  }
}
