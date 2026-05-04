import type { Warehouse } from "@/types/warehouse";

type StockFiltersProps = {
  warehouses: Warehouse[];
  values: {
    warehouseId?: string;
    search?: string;
    onlyPositive?: boolean;
  };
};

export function StockFilters({ warehouses, values }: StockFiltersProps) {
  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" method="get">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Almacen
          <select
            name="warehouseId"
            defaultValue={values.warehouseId ?? ""}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 md:col-span-2">
          Buscar variante / SKU
          <input
            name="search"
            defaultValue={values.search ?? ""}
            placeholder="Ej: atun 170g o SKU"
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="onlyPositive"
            value="1"
            defaultChecked={values.onlyPositive ?? true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Mostrar solo stock mayor a cero
        </label>

        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Aplicar filtros
        </button>

        <a
          href="/stock"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Limpiar
        </a>
      </div>
    </form>
  );
}
