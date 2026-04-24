import { requireRole } from "@/server/profile";
import { listWarehouseStock } from "@/server/stock";

export default async function StockPage() {
  await requireRole(["admin", "operator", "owner"]);
  const stockRows = await listWarehouseStock();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Stock actual</h2>
      <p className="text-slate-600">Vista derivada desde la view `warehouse_stock`.</p>

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
                  Sin datos de stock todavia.
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
