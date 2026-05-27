import { requireRole } from "@/server/profile";
import { listMovementsForHistoryWithFilters } from "@/server/movements";
import { listWarehouses } from "@/server/warehouses";
import type { MovementStatus, MovementType } from "@/types/domain";
import { HistoryFilters } from "./history-filters";
import { HistoryTable } from "./history-table";
import { PaginationControls } from "./pagination-controls";

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

function asNumber(value: string | string[] | undefined): number {
  if (Array.isArray(value)) {
    const parsed = parseInt(value[0], 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseInt(value ?? "0", 10);
  return isNaN(parsed) ? 0 : parsed;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  await requireRole(["admin", "operator", "owner"]);
  const params = (await searchParams) ?? {};

  const movementTypeRaw = asValue(params.movementType);
  const statusRaw = asValue(params.status);
  const pageParam = asNumber(params.page);
  const limitParam = asNumber(params.limit);
  const showAuditRaw = asValue(params.showAudit);
  const showAudit = showAuditRaw === "true";

  const page = pageParam > 0 ? pageParam : 1;
  const limit = limitParam > 0 ? Math.min(limitParam, 100) : 20;
  const offset = (page - 1) * limit;

  const filters = {
    movementType: movementTypeRaw && MOVEMENT_TYPES.has(movementTypeRaw as MovementType) ? (movementTypeRaw as MovementType) : undefined,
    status: statusRaw && MOVEMENT_STATUSES.has(statusRaw as MovementStatus) ? (statusRaw as MovementStatus) : undefined,
    warehouseId: asValue(params.warehouseId),
    search: asValue(params.search),
    from: asValue(params.from),
    to: asValue(params.to),
    offset,
    limit,
    showAudit,
  };

  const [paginatedResult, warehouses] = await Promise.all([
    listMovementsForHistoryWithFilters(filters),
    listWarehouses(),
  ]);

  const { movements, total } = paginatedResult;
  const totalPages = Math.ceil(total / limit);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Historial</h2>
      <p className="text-slate-600">Consulta de movimientos registrados en orden cronologico descendente.</p>

      <div className="sticky top-0 z-10 bg-white pb-4">
        <HistoryFilters warehouses={warehouses} values={filters} />
      </div>

      {total > 0 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
        />
      )}

      <HistoryTable movements={movements} warehouses={warehouses} />

      {total > limit && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
        />
      )}
    </section>
  );
}