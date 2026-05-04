import { requireRole } from "@/server/profile";
import { listMovementsForHistoryWithFilters } from "@/server/movements";
import { listWarehouses } from "@/server/warehouses";
import type { MovementStatus, MovementType } from "@/types/domain";
import { HistoryFilters } from "./history-filters";

const MOVEMENT_TYPES = new Set<MovementType>(["entry", "exit", "transfer", "adjustment"]);
const MOVEMENT_STATUSES = new Set<MovementStatus>(["confirmed", "in_transit", "received", "received_with_incident"]);

type HistoryPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function asValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  await requireRole(["admin", "operator", "owner"]);
  const params = (await searchParams) ?? {};

  const movementTypeRaw = asValue(params.movementType);
  const statusRaw = asValue(params.status);

  const filters = {
    movementType: movementTypeRaw && MOVEMENT_TYPES.has(movementTypeRaw as MovementType) ? (movementTypeRaw as MovementType) : undefined,
    status: statusRaw && MOVEMENT_STATUSES.has(statusRaw as MovementStatus) ? (statusRaw as MovementStatus) : undefined,
    warehouseId: asValue(params.warehouseId),
    search: asValue(params.search),
    from: asValue(params.from),
    to: asValue(params.to),
    limit: 100,
  };

  const [movements, warehouses] = await Promise.all([
    listMovementsForHistoryWithFilters(filters),
    listWarehouses(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Historial</h2>
      <p className="text-slate-600">Consulta de movimientos registrados en orden cronologico descendente.</p>

      <HistoryFilters warehouses={warehouses} values={filters} />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Origen</th>
              <th className="px-3 py-2 font-medium">Destino</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Notas</th>
              <th className="px-3 py-2 font-medium">Incidencia</th>
              <th className="px-3 py-2 font-medium">Ajuste</th>
              <th className="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td colSpan={10} className="px-3 py-6 text-center text-sm text-slate-500">
                  No hay movimientos para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 text-sm text-slate-700">{new Date(movement.created_at).toLocaleString("es-ES")}</td>
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{movement.movement_type}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{movement.status}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.origin_warehouse_name ?? "-"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.destination_warehouse_name ?? "-"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.actor_name}</td>
                  <td className="max-w-40 truncate px-3 py-3 text-xs text-slate-600">{movement.notes ?? "-"}</td>
                  <td className="max-w-40 truncate px-3 py-3 text-xs text-slate-600">{movement.incident_note ?? "-"}</td>
                  <td className="max-w-44 truncate px-3 py-3 text-xs text-slate-600">
                    {movement.adjustment_reason
                      ? `${movement.adjustment_direction ?? ""}: ${movement.adjustment_reason}`
                      : "-"}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">{movement.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
