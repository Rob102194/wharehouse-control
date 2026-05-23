import { requireRole } from "@/server/profile";
import { getProductStockSummary, listWarehouseStockWithFilters } from "@/server/stock";
import { listWarehouses } from "@/server/warehouses";
import { StockFilters } from "./stock-filters";
import { StockViewToggle } from "./stock-view-toggle";
import { StockTable } from "./stock-table";

type StockPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const profile = await requireRole(["admin", "operator", "owner"]);
  const params = (await searchParams) ?? {};

  const onlyPositiveParam = asValue(params.onlyPositive);
  const onlyPositive = onlyPositiveParam === undefined ? true : onlyPositiveParam === "1";

  const filters = {
    warehouseId: asValue(params.warehouseId),
    search: asValue(params.search),
    onlyPositive,
    limit: 500,
  };

  const [stockRows, warehouses, productSummaries] = await Promise.all([
    listWarehouseStockWithFilters(filters),
    listWarehouses(),
    getProductStockSummary(filters.warehouseId ?? undefined),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Stock actual</h2>
        <p className="text-slate-600">Vista derivada desde la view `warehouse_stock`.</p>
      </div>

      <StockFilters warehouses={warehouses} values={filters} />

      <StockTable stockRows={stockRows} canAdjust={profile.role !== "owner"} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Stock consolidado por producto</h3>
        <StockViewToggle summaries={productSummaries} />
      </div>
    </section>
  );
}
