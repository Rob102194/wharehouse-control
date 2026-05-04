import { requireRole } from "@/server/profile";
import { listWarehouseStockWithFilters } from "@/server/stock";
import { listWarehouses } from "@/server/warehouses";
import { StockFilters } from "./stock-filters";

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
  await requireRole(["admin", "operator", "owner"]);
  const params = (await searchParams) ?? {};

  const onlyPositiveParam = asValue(params.onlyPositive);
  const onlyPositive = onlyPositiveParam === undefined ? true : onlyPositiveParam === "1";

  const filters = {
    warehouseId: asValue(params.warehouseId),
    search: asValue(params.search),
    onlyPositive,
    limit: 500,
  };

  const [stockRows, warehouses] = await Promise.all([
    listWarehouseStockWithFilters(filters),
    listWarehouses(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Stock actual</h2>
      <p className="text-slate-600">Vista derivada desde la view `warehouse_stock`.</p>

      <StockFilters warehouses={warehouses} values={filters} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Almacen</th>
              <th className="px-3 py-2 font-medium">Variante</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Stock</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                  No hay filas de stock para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              stockRows.map((row) => (
                <tr key={`${row.warehouse_id}-${row.product_variant_id}`} className="border-t border-slate-200">
                  <td className="px-3 py-3 text-sm text-slate-800">{row.warehouse_name}</td>
                  <td className="px-3 py-3 text-sm text-slate-800">{row.product_variant_name}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{row.sku ?? "-"}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">{Number(row.stock).toFixed(3)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
