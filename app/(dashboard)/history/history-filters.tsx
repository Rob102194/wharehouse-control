import type { MovementStatus, MovementType } from "@/types/domain";
import type { Warehouse } from "@/types/warehouse";

type HistoryFiltersProps = {
  warehouses: Warehouse[];
  values: {
    movementType?: MovementType;
    status?: MovementStatus;
    warehouseId?: string;
    search?: string;
    from?: string;
    to?: string;
  };
};

const movementTypeOptions: Array<{ value: MovementType; label: string }> = [
  { value: "entry", label: "Entrada" },
  { value: "exit", label: "Salida" },
  { value: "transfer", label: "Transferencia" },
  { value: "adjustment", label: "Ajuste" },
];

const statusOptions: Array<{ value: MovementStatus; label: string }> = [
  { value: "confirmed", label: "Confirmado" },
  { value: "in_transit", label: "En transito" },
  { value: "received", label: "Recibido" },
  { value: "received_with_incident", label: "Recibido con incidencia" },
];

export function HistoryFilters({ warehouses, values }: HistoryFiltersProps) {
  return (
    <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" method="get">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Tipo
          <select
            name="movementType"
            defaultValue={values.movementType ?? ""}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {movementTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Estado
          <select
            name="status"
            defaultValue={values.status ?? ""}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 lg:col-span-2">
          Buscar
          <input
            name="search"
            defaultValue={values.search ?? ""}
            placeholder="ID o texto en notas"
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Desde
          <input
            type="date"
            name="from"
            defaultValue={values.from ?? ""}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
          Hasta
          <input
            type="date"
            name="to"
            defaultValue={values.to ?? ""}
            className="h-9 rounded-md border border-slate-300 px-2 text-sm text-slate-900"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Aplicar filtros
        </button>
        <a
          href="/history"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Limpiar
        </a>
      </div>
    </form>
  );
}
