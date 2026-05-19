import { requireRole } from "@/server/profile";
import { listMovementsForHistoryWithFilters } from "@/server/movements";
import { listWarehouses } from "@/server/warehouses";
import type { MovementStatus, MovementType } from "@/types/domain";
import { HistoryFilters } from "./history-filters";
import { HistoryTable } from "./history-table";

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

      <HistoryTable movements={movements} />
    </section>
  );
}
