import { createSupabaseAdminClient } from "@/supabase/admin";
import type {
  Movement,
  MovementHistoryFilters,
  MovementHistoryRow,
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
  return listMovementsForHistoryWithFilters({ limit });
}

export async function listMovementsForHistoryWithFilters(filters: MovementHistoryFilters): Promise<MovementHistoryRow[]> {
  const adminClient = createSupabaseAdminClient();

  const limit = filters.limit ?? 100;
  let query = adminClient
    .from("movements")
    .select(
      "id, movement_type, status, origin_warehouse_id, destination_warehouse_id, adjustment_direction, adjustment_reason, notes, incident_note, created_by, created_at, confirmed_at, received_by, received_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.movementType) {
    query = query.eq("movement_type", filters.movementType);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.warehouseId) {
    query = query.or(
      `origin_warehouse_id.eq.${filters.warehouseId},destination_warehouse_id.eq.${filters.warehouseId}`,
    );
  }

  if (filters.from) {
    query = query.gte("created_at", `${filters.from}T00:00:00`);
  }

  if (filters.to) {
    query = query.lte("created_at", `${filters.to}T23:59:59`);
  }

  const { data: movements, error } = await query.returns<Movement[]>();

  if (error || !movements || movements.length === 0) {
    return [];
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

  if (filteredMovements.length === 0) {
    return [];
  }

  const warehouseIds = Array.from(
    new Set(
      filteredMovements
        .flatMap((movement) => [movement.origin_warehouse_id, movement.destination_warehouse_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const actorIds = Array.from(new Set(filteredMovements.map((movement) => movement.created_by)));

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

  return filteredMovements.map((movement) => ({
    id: movement.id,
    movement_type: movement.movement_type,
    status: movement.status,
    origin_warehouse_name: movement.origin_warehouse_id ? warehouseMap.get(movement.origin_warehouse_id) ?? movement.origin_warehouse_id : null,
    destination_warehouse_name: movement.destination_warehouse_id
      ? warehouseMap.get(movement.destination_warehouse_id) ?? movement.destination_warehouse_id
      : null,
    actor_name: actorMap.get(movement.created_by) ?? movement.created_by,
    created_at: movement.created_at,
    notes: movement.notes,
    incident_note: movement.incident_note,
    adjustment_reason: movement.adjustment_reason,
    adjustment_direction: movement.adjustment_direction,
  }));
}
