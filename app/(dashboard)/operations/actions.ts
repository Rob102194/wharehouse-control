"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/profile";
import {
  createEntry,
  createExit,
  createTransfer,
  receiveTransfer,
} from "@/server/movements";
import type { MovementRpcItemInput, TransferReceiptItemInput } from "@/types/movement-item";

export type OperationActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  lineErrors?: Array<{
    rowIndex: number;
    productVariantId?: string;
    field: "productVariantId" | "quantity";
    message: string;
  }>;
};

function successState(message: string): OperationActionState {
  return { ok: true, message };
}

function errorState(
  message: string,
  extras?: Pick<OperationActionState, "fieldErrors" | "lineErrors">,
): OperationActionState {
  return {
    ok: false,
    message,
    fieldErrors: extras?.fieldErrors,
    lineErrors: extras?.lineErrors,
  };
}

function sanitize(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function validateMovementItems(rawItems: string):
  | { ok: true; items: MovementRpcItemInput[] }
  | {
      ok: false;
      message: string;
      lineErrors: NonNullable<OperationActionState["lineErrors"]>;
    } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawItems);
  } catch {
    return {
      ok: false,
      message: "No se pudo leer las lineas del movimiento.",
      lineErrors: [],
    };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return {
      ok: false,
      message: "Debes incluir al menos una linea en items.",
      lineErrors: [],
    };
  }

  const normalized: MovementRpcItemInput[] = [];
  const lineErrors: NonNullable<OperationActionState["lineErrors"]> = [];

  parsed.forEach((item, rowIndex) => {
    const input = item as MovementRpcItemInput;
    const productVariantId = String(input.product_variant_id ?? "").trim();
    const quantity = Number(input.quantity);

    if (!productVariantId) {
      lineErrors.push({
        rowIndex,
        field: "productVariantId",
        message: "Selecciona una variante en esta linea.",
      });
    }

    if (Number.isNaN(quantity)) {
      lineErrors.push({
        rowIndex,
        productVariantId: productVariantId || undefined,
        field: "quantity",
        message: "Ingresa una cantidad valida.",
      });
    } else if (quantity <= 0) {
      lineErrors.push({
        rowIndex,
        productVariantId: productVariantId || undefined,
        field: "quantity",
        message: "La cantidad debe ser mayor a cero.",
      });
    }

    normalized.push({ product_variant_id: productVariantId, quantity });
  });

  if (lineErrors.length > 0) {
    return {
      ok: false,
      message: "Revisa las lineas del movimiento marcadas.",
      lineErrors,
    };
  }

  return { ok: true, items: normalized };
}

function validateReceiptItems(rawItems: string):
  | { ok: true; items: TransferReceiptItemInput[] }
  | {
      ok: false;
      message: string;
      lineErrors: NonNullable<OperationActionState["lineErrors"]>;
    } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawItems);
  } catch {
    return {
      ok: false,
      message: "No se pudo leer las lineas de recepcion.",
      lineErrors: [],
    };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return {
      ok: false,
      message: "Debes incluir al menos una linea en recepcion.",
      lineErrors: [],
    };
  }

  const normalized: TransferReceiptItemInput[] = [];
  const lineErrors: NonNullable<OperationActionState["lineErrors"]> = [];

  parsed.forEach((item, rowIndex) => {
    const input = item as TransferReceiptItemInput;
    const productVariantId = String(input.product_variant_id ?? "").trim();
    const receivedQuantity = Number(input.received_quantity);

    if (!productVariantId) {
      lineErrors.push({
        rowIndex,
        productVariantId: undefined,
        field: "productVariantId",
        message: "Selecciona una variante en esta linea.",
      });
    }

    if (Number.isNaN(receivedQuantity)) {
      lineErrors.push({
        rowIndex,
        productVariantId: productVariantId || undefined,
        field: "quantity",
        message: "Ingresa una cantidad valida.",
      });
    } else if (receivedQuantity < 0) {
      lineErrors.push({
        rowIndex,
        productVariantId: productVariantId || undefined,
        field: "quantity",
        message: "La cantidad recibida no puede ser negativa.",
      });
    }

    normalized.push({
      product_variant_id: productVariantId,
      received_quantity: receivedQuantity,
    });
  });

  if (lineErrors.length > 0) {
    return {
      ok: false,
      message: "Revisa las lineas de recepcion marcadas.",
      lineErrors,
    };
  }

  return { ok: true, items: normalized };
}

function revalidateOperationalViews() {
  revalidatePath("/operations");
  revalidatePath("/history");
  revalidatePath("/stock");
}

function mapOperationErrorMessage(message: string) {
  if (message.includes("Insufficient stock for variant")) {
    return "Stock insuficiente para completar el movimiento.";
  }

  if (message.includes("Origin and destination warehouses must be different")) {
    return "El almacen origen y destino deben ser distintos.";
  }

  if (message.includes("Invalid movement items") || message.includes("Invalid received items")) {
    return "Hay lineas invalidas en el movimiento.";
  }

  if (message.includes("Duplicate product_variant_id in items") || message.includes("Duplicate product_variant_id in received items")) {
    return "No se permiten variantes repetidas en las lineas.";
  }

  if (message.includes("Invalid or inactive product variant in items")) {
    return "Hay variantes invalidas o inactivas en las lineas.";
  }

  if (message.includes("Origin warehouse is invalid or inactive")) {
    return "El almacen origen es invalido o esta inactivo.";
  }

  if (message.includes("Destination warehouse is invalid or inactive")) {
    return "El almacen destino es invalido o esta inactivo.";
  }

  if (message.includes("Warehouse is invalid or inactive")) {
    return "El almacen seleccionado es invalido o esta inactivo.";
  }

  if (message.includes("Invalid actor profile")) {
    return "El usuario actual no tiene un perfil valido para operar.";
  }

  if (message.includes("Actor role cannot create entries")) {
    return "Tu rol no puede crear entradas.";
  }

  if (message.includes("Actor role cannot create exits")) {
    return "Tu rol no puede crear salidas.";
  }

  if (message.includes("Actor role cannot create transfers")) {
    return "Tu rol no puede crear transferencias.";
  }

  if (message.includes("Actor role cannot receive transfers")) {
    return "Tu rol no puede confirmar recepciones.";
  }

  if (message.includes("Actor role cannot create adjustments")) {
    return "Tu rol no puede crear ajustes.";
  }

  if (message.includes("Received quantity cannot exceed dispatched quantity")) {
    return "La cantidad recibida no puede superar la despachada.";
  }

  if (message.includes("Transfer is not in transit")) {
    return "La transferencia ya no esta en transito.";
  }

  if (message.includes("Transfer movement not found")) {
    return "No se encontro la transferencia seleccionada.";
  }

  if (message.includes("Missing movement items in transfer receipt")) {
    return "La recepcion no incluye todas las lineas despachadas.";
  }

  if (message.includes("Received items contain unknown product variants")) {
    return "La recepcion incluye variantes que no pertenecen a la transferencia.";
  }

  return message;
}

export async function createEntryAction(_prev: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const destinationWarehouseId = sanitize(formData.get("destination_warehouse_id"));
    const notes = sanitize(formData.get("notes"));
    const validatedItems = validateMovementItems(sanitize(formData.get("items_json")));

    if (!destinationWarehouseId) {
      return errorState("Debes seleccionar almacen destino.", {
        fieldErrors: { destination_warehouse_id: "Debes seleccionar almacen destino." },
      });
    }

    if (!validatedItems.ok) {
      return errorState(validatedItems.message, { lineErrors: validatedItems.lineErrors });
    }

    const movementId = await createEntry(destinationWarehouseId, actor.id, validatedItems.items, notes);
    revalidateOperationalViews();

    return successState(`Entrada creada (${movementId}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la entrada.";
    return errorState(mapOperationErrorMessage(message));
  }
}

export async function createExitAction(_prev: OperationActionState, formData: FormData): Promise<OperationActionState> {
  const actor = await requireRole(["admin", "operator"]);

  try {
    const originWarehouseId = sanitize(formData.get("origin_warehouse_id"));
    const notes = sanitize(formData.get("notes"));
    const validatedItems = validateMovementItems(sanitize(formData.get("items_json")));

    if (!originWarehouseId) {
      return errorState("Debes seleccionar almacen origen.", {
        fieldErrors: { origin_warehouse_id: "Debes seleccionar almacen origen." },
      });
    }

    if (!validatedItems.ok) {
      return errorState(validatedItems.message, { lineErrors: validatedItems.lineErrors });
    }

    const movementId = await createExit(originWarehouseId, actor.id, validatedItems.items, notes);
    revalidateOperationalViews();

    return successState(`Salida creada (${movementId}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la salida.";
    return errorState(mapOperationErrorMessage(message));
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
    const validatedItems = validateMovementItems(sanitize(formData.get("items_json")));

    if (!originWarehouseId || !destinationWarehouseId) {
      const fieldErrors: Record<string, string> = {};
      if (!originWarehouseId) {
        fieldErrors.origin_warehouse_id = "Debes seleccionar almacen origen.";
      }

      if (!destinationWarehouseId) {
        fieldErrors.destination_warehouse_id = "Debes seleccionar almacen destino.";
      }

      return errorState("Debes seleccionar almacen origen y destino.", {
        fieldErrors,
      });
    }

    if (!validatedItems.ok) {
      return errorState(validatedItems.message, { lineErrors: validatedItems.lineErrors });
    }

    const movementId = await createTransfer(originWarehouseId, destinationWarehouseId, actor.id, validatedItems.items, notes);
    revalidateOperationalViews();

    return successState(`Transferencia creada (${movementId}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la transferencia.";
    return errorState(mapOperationErrorMessage(message));
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
    const validatedItems = validateReceiptItems(sanitize(formData.get("items_json")));

    if (!movementId) {
      return errorState("Debes indicar el id de transferencia en transito.", {
        fieldErrors: { movement_id: "Debes seleccionar una transferencia en transito." },
      });
    }

    if (!validatedItems.ok) {
      return errorState(validatedItems.message, { lineErrors: validatedItems.lineErrors });
    }

    const receivedMovementId = await receiveTransfer(movementId, actor.id, validatedItems.items, incidentNote);
    revalidateOperationalViews();

    return successState(`Transferencia recibida (${receivedMovementId}).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo confirmar la recepcion.";
    return errorState(mapOperationErrorMessage(message));
  }
}


