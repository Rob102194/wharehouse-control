import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Warehouse } from "@/types/warehouse";
import type { WarehouseStock, WarehouseStockFilters } from "@/types/warehouse-stock";

type WarehouseStockRow = {
  warehouse_id: string;
  product_variant_id: string;
  stock: number;
};

type ProductVariantLookup = {
  id: string;
  name: string;
  sku: string | null;
};

export async function listWarehouseStock(): Promise<WarehouseStock[]> {
  return listWarehouseStockWithFilters({ onlyPositive: true, limit: 500 });
}

export async function listWarehouseStockWithFilters(filters: WarehouseStockFilters): Promise<WarehouseStock[]> {
  const adminClient = createSupabaseAdminClient();
  const limit = filters.limit ?? 500;
  let query = adminClient
    .from("warehouse_stock")
    .select("warehouse_id, product_variant_id, stock")
    .order("stock", { ascending: false })
    .order("warehouse_id", { ascending: true })
    .order("product_variant_id", { ascending: true })
    .limit(limit);

  if (filters.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  if (filters.onlyPositive ?? true) {
    query = query.gt("stock", 0);
  }

  const { data: stockRows, error: stockError } = await query.returns<WarehouseStockRow[]>();

  if (stockError || !stockRows || stockRows.length === 0) {
    return [];
  }

  const warehouseIds = Array.from(new Set(stockRows.map((row) => row.warehouse_id)));
  const productVariantIds = Array.from(new Set(stockRows.map((row) => row.product_variant_id)));

  const [{ data: warehouses }, { data: variants }] = await Promise.all([
    adminClient.from("warehouses").select("id, code, name, active, created_at, updated_at").in("id", warehouseIds).returns<Warehouse[]>(),
    adminClient
      .from("product_variants")
      .select("id, name, sku")
      .in("id", productVariantIds)
      .returns<ProductVariantLookup[]>(),
  ]);

  const warehouseMap = new Map((warehouses ?? []).map((warehouse) => [warehouse.id, warehouse]));
  const variantMap = new Map((variants ?? []).map((variant) => [variant.id, variant]));

  const normalizedSearch = filters.search?.trim().toLowerCase();

  const rows = stockRows.map((row) => ({
    warehouse_id: row.warehouse_id,
    warehouse_name: warehouseMap.get(row.warehouse_id)?.name ?? "Almacen desconocido",
    product_variant_id: row.product_variant_id,
    product_variant_name: variantMap.get(row.product_variant_id)?.name ?? "Variante desconocida",
    sku: variantMap.get(row.product_variant_id)?.sku ?? null,
    stock: row.stock,
  }));

  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) => {
    const haystack = `${row.product_variant_name} ${row.sku ?? ""} ${row.product_variant_id}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });
}
