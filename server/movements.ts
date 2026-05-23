import { createSupabaseAdminClient } from "@/supabase/admin";
import type {
  Movement,
  MovementHistoryFilters,
  MovementHistoryRow,
  PaginatedMovements,
  TransferInTransit,
  TransferInTransitWithItems,
} from "@/types/movement";
import type { MovementRpcItemInput, TransferReceiptItemInput } from "@/types/movement-item";
import type { Profile } from "@/types/profile";
import type { ProductVariant } from "@/types/product-variant";
import type { Warehouse } from "@/types/warehouse";

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
  const { data: transfers, error } = await adminClient
    .from("movements")
    .select("id, origin_warehouse_id, destination_warehouse_id, created_at, notes")
    .eq("movement_type", "transfer")
    .eq("status", "in_transit")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<TransferInTransit[]>();

  if (error || !transfers || transfers.length === 0) {
    return [];
  }

  const warehouseIds = Array.from(
    new Set(
      transfers
        .flatMap((transfer) => [transfer.origin_warehouse_id, transfer.destination_warehouse_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: warehouses } = await adminClient
    .from("warehouses")
    .select("id, code, name")
    .in("id", warehouseIds)
    .returns<MovementWarehouse[]>();

  const warehouseMap = new Map((warehouses ?? []).map((warehouse) => [warehouse.id, `${warehouse.code} - ${warehouse.name}`]));

  return transfers.map((transfer) => ({
    ...transfer,
    origin_warehouse_name: warehouseMap.get(transfer.origin_warehouse_id) ?? null,
    destination_warehouse_name: warehouseMap.get(transfer.destination_warehouse_id) ?? null,
  }));
}

type TransferItemRow = {
  movement_id: string;
  product_variant_id: string;
  quantity: number;
};

type ProductVariantLookup = Pick<ProductVariant, "id" | "name" | "sku">;

export async function listTransfersInTransitWithItems(limit = 50): Promise<TransferInTransitWithItems[]> {
  const transfers = await listTransfersInTransit(limit);

  if (transfers.length === 0) {
    return [];
  }

  const adminClient = createSupabaseAdminClient();
  const transferIds = transfers.map((transfer) => transfer.id);

  const { data: itemRows, error: itemsError } = await adminClient
    .from("movement_items")
    .select("movement_id, product_variant_id, quantity")
    .in("movement_id", transferIds)
    .returns<TransferItemRow[]>();

  if (itemsError || !itemRows) {
    return transfers.map((transfer) => ({ ...transfer, items: [] }));
  }

  const variantIds = Array.from(new Set(itemRows.map((item) => item.product_variant_id)));

  const { data: variants } = await adminClient
    .from("product_variants")
    .select("id, name, sku")
    .in("id", variantIds)
    .returns<ProductVariantLookup[]>();

  const variantMap = new Map((variants ?? []).map((variant) => [variant.id, variant]));

  const itemsByTransfer = new Map<string, TransferInTransitWithItems["items"]>();
  for (const item of itemRows) {
    const current = itemsByTransfer.get(item.movement_id) ?? [];
    const variant = variantMap.get(item.product_variant_id);

    current.push({
      product_variant_id: item.product_variant_id,
      product_variant_name: variant?.name ?? "Variante desconocida",
      sku: variant?.sku ?? null,
      quantity: item.quantity,
    });

    itemsByTransfer.set(item.movement_id, current);
  }

  return transfers.map((transfer) => ({
    ...transfer,
    items: itemsByTransfer.get(transfer.id) ?? [],
  }));
}

type MovementActor = Pick<Profile, "id" | "full_name" | "username">;
type MovementWarehouse = Pick<Warehouse, "id" | "name" | "code">;

export async function listMovementsForHistory(limit = 100): Promise<MovementHistoryRow[]> {
  const result = await listMovementsForHistoryWithFilters({ limit });
  return result.movements;
}

export async function listMovementsForHistoryWithFilters(filters: MovementHistoryFilters): Promise<PaginatedMovements> {
  const adminClient = createSupabaseAdminClient();

  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 20;

  let baseQuery = adminClient
    .from("movements")
    .select(
      "id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, adjustment_reason, notes, incident_note, created_by, created_at, confirmed_at, received_by, received_at, edit_history",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (filters.movementType) {
    baseQuery = baseQuery.eq("movement_type", filters.movementType);
  }

  if (filters.status) {
    baseQuery = baseQuery.eq("status", filters.status);
  }

  if (filters.warehouseId) {
    baseQuery = baseQuery.or(
      `origin_warehouse_id.eq.${filters.warehouseId},destination_warehouse_id.eq.${filters.warehouseId}`,
    );
  }

  if (filters.from) {
    baseQuery = baseQuery.gte("created_at", `${filters.from}T00:00:00`);
  }

  if (filters.to) {
    baseQuery = baseQuery.lte("created_at", `${filters.to}T23:59:59`);
  }

  const { data: movements, error, count } = await baseQuery.returns<Movement[]>();

  if (error || !movements || movements.length === 0) {
    return { movements: [], total: count ?? 0, offset, limit };
  }

  const normalizedSearch = filters.search?.trim().toLowerCase();
  const filteredMovements = normalizedSearch
    ? movements.filter((movement) => {
        const haystack = [
          movement.id,
          movement.notes ?? "",
          movement.incident_note ?? "",
          movement.adjustment_reason ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
    : movements;

  const totalFiltered = filteredMovements.length;
  const paginatedMovements = filteredMovements.slice(offset, offset + limit);

  if (paginatedMovements.length === 0) {
    return { movements: [], total: totalFiltered, offset, limit };
  }

  const warehouseIds = Array.from(
    new Set(
      paginatedMovements
        .flatMap((movement) => [movement.origin_warehouse_id, movement.destination_warehouse_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const actorIds = Array.from(new Set(paginatedMovements.map((movement) => movement.created_by)));

  const [{ data: warehouses }, { data: actors }] = await Promise.all([
    warehouseIds.length > 0
      ? adminClient.from("warehouses").select("id, name, code").in("id", warehouseIds).returns<MovementWarehouse[]>()
      : Promise.resolve({ data: [] as MovementWarehouse[], error: null }),
    actorIds.length > 0
      ? adminClient.from("profiles").select("id, full_name, username").in("id", actorIds).returns<MovementActor[]>()
      : Promise.resolve({ data: [] as MovementActor[], error: null }),
  ]);

  const warehouseMap = new Map((warehouses ?? []).map((warehouse) => [warehouse.id, `${warehouse.code} - ${warehouse.name}`]));
  const actorMap = new Map((actors ?? []).map((actor) => [actor.id, actor.full_name ?? actor.username]));

  const movementIds = paginatedMovements.map((m) => m.id);
  let itemsMap: Map<string, Array<{ product_variant_id: string; product_variant_name: string; sku: string | null; quantity: number }>> = new Map();

  if (movementIds.length > 0) {
    const { data: itemRows } = await adminClient
      .from("movement_items")
      .select("movement_id, product_variant_id, quantity")
      .in("movement_id", movementIds)
      .returns<{ movement_id: string; product_variant_id: string; quantity: number }[]>();

    if (itemRows && itemRows.length > 0) {
      const variantIds = [...new Set(itemRows.map((i) => i.product_variant_id))];
      const { data: variants } = await adminClient
        .from("product_variants")
        .select("id, name, sku")
        .in("id", variantIds)
        .returns<{ id: string; name: string; sku: string | null }[]>();

      const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

      for (const item of itemRows) {
        const existing = itemsMap.get(item.movement_id) ?? [];
        existing.push({
          product_variant_id: item.product_variant_id,
          product_variant_name: variantMap.get(item.product_variant_id)?.name ?? "Desconocido",
          sku: variantMap.get(item.product_variant_id)?.sku ?? null,
          quantity: item.quantity,
        });
        itemsMap.set(item.movement_id, existing);
      }
    }
  }

  return {
    movements: paginatedMovements.map((movement) => {
      const editHistory = (movement.edit_history as Record<string, unknown>[]) ?? [];
      return {
        id: movement.id,
        movement_type: movement.movement_type,
        status: movement.status,
        origin_warehouse_id: movement.origin_warehouse_id,
        origin_warehouse_name: movement.origin_warehouse_id ? warehouseMap.get(movement.origin_warehouse_id) ?? movement.origin_warehouse_id : null,
        destination_warehouse_id: movement.destination_warehouse_id,
        destination_warehouse_name: movement.destination_warehouse_id
          ? warehouseMap.get(movement.destination_warehouse_id) ?? movement.destination_warehouse_id
          : null,
        actor_name: actorMap.get(movement.created_by) ?? movement.created_by,
        created_at: movement.created_at,
        notes: movement.notes,
        incident_note: movement.incident_note,
        adjustment_reason: movement.adjustment_reason,
        adjustment_direction: movement.adjustment_direction,
        edit_count: editHistory.length,
        is_incident: movement.status === "received_with_incident",
        items: itemsMap.get(movement.id) ?? [],
      };
    }),
    total: totalFiltered,
    offset,
    limit,
  };
}

export async function getMovementWithItems(movementId: string): Promise<MovementWithItems | null> {
  const adminClient = createSupabaseAdminClient();

  const { data: movement, error } = await adminClient
    .from("movements")
    .select(
      "id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, adjustment_reason, notes, incident_note, created_by, created_at, confirmed_at, received_by, received_at, edit_history",
    )
    .eq("id", movementId)
    .single();

  if (error || !movement) {
    return null;
  }

  const { data: items, error: itemsError } = await adminClient
    .from("movement_items")
    .select("id, product_variant_id, quantity")
    .eq("movement_id", movementId)
    .returns<{ id: string; product_variant_id: string; quantity: number }[]>();

  if (itemsError || !items) {
    return { ...movement, items: [] };
  }

  const variantIds = items.map((item) => item.product_variant_id);
  const { data: variants } = await adminClient
    .from("product_variants")
    .select("id, name, sku")
    .in("id", variantIds)
    .returns<{ id: string; name: string; sku: string | null }[]>();

  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

  return {
    ...movement,
    items: items.map((item) => ({
      id: item.id,
      product_variant_id: item.product_variant_id,
      product_variant_name: variantMap.get(item.product_variant_id)?.name ?? "Desconocido",
      sku: variantMap.get(item.product_variant_id)?.sku ?? null,
      quantity: item.quantity,
    })),
  };
}

type MovementWithItems = Movement & {
  items: Array<{
    id: string;
    product_variant_id: string;
    product_variant_name: string;
    sku: string | null;
    quantity: number;
  }>;
};

export async function createCompensationMovement(
  originalMovement: Movement,
  items: Array<{ product_variant_id: string; quantity: number }>,
  createdBy: string,
): Promise<string> {
  const adminClient = createSupabaseAdminClient();
  const compensationItems: MovementRpcItemInput[] = items.map((item) => ({
    product_variant_id: item.product_variant_id,
    quantity: item.quantity,
  }));

  switch (originalMovement.movement_type) {
    case "entry": {
      if (!originalMovement.origin_warehouse_id) {
        throw new Error("Entry movement has no origin warehouse");
      }
      const { data, error } = await adminClient.rpc("create_exit", {
        p_origin_warehouse_id: originalMovement.origin_warehouse_id,
        p_created_by: createdBy,
        p_items: compensationItems,
        p_notes: `Compensación por edición de movimiento ${originalMovement.id}`,
        p_allow_negative: true,
      });
      if (error || !data) {
        throw new Error(normalizeRpcError(error?.message ?? "Error al crear compensación (exit)"));
      }
      return data as string;
    }
    case "exit": {
      if (!originalMovement.origin_warehouse_id) {
        throw new Error("Exit movement has no origin warehouse");
      }
      const { data, error } = await adminClient.rpc("create_entry", {
        p_destination_warehouse_id: originalMovement.origin_warehouse_id,
        p_created_by: createdBy,
        p_items: compensationItems,
        p_notes: `Compensación por edición de movimiento ${originalMovement.id}`,
      });
      if (error || !data) {
        throw new Error(normalizeRpcError(error?.message ?? "Error al crear compensación (entry)"));
      }
      return data as string;
    }
    case "transfer": {
      if (!originalMovement.origin_warehouse_id || !originalMovement.destination_warehouse_id) {
        throw new Error("Transfer movement has missing warehouses");
      }
      const { data, error } = await adminClient.rpc("create_transfer", {
        p_origin_warehouse_id: originalMovement.destination_warehouse_id,
        p_destination_warehouse_id: originalMovement.origin_warehouse_id,
        p_created_by: createdBy,
        p_items: compensationItems,
        p_notes: `Compensación por edición de movimiento ${originalMovement.id}`,
        p_allow_negative: true,
      });
      if (error || !data) {
        throw new Error(normalizeRpcError(error?.message ?? "Error al crear compensación (transfer)"));
      }
      return data as string;
    }
    case "adjustment": {
      if (!originalMovement.origin_warehouse_id) {
        throw new Error("Adjustment movement has no warehouse");
      }
      const direction = originalMovement.adjustment_direction === "positive" ? "negative" : "positive";
      const { data, error } = await adminClient.rpc("create_adjustment", {
        p_warehouse_id: originalMovement.origin_warehouse_id,
        p_created_by: createdBy,
        p_adjustment_direction: direction,
        p_adjustment_reason: `Compensación por edición de movimiento ${originalMovement.id}`,
        p_items: compensationItems,
        p_notes: `Compensación por edición de movimiento ${originalMovement.id}`,
        p_allow_negative: true,
      });
      if (error || !data) {
        throw new Error(normalizeRpcError(error?.message ?? "Error al crear compensación (adjustment)"));
      }
      return data as string;
    }
    default:
      throw new Error(`Unsupported movement type for compensation: ${originalMovement.movement_type}`);
  }
}
