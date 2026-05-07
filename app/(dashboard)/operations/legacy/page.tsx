import { OperationsConsole } from "@/app/(dashboard)/operations/operations-console";
import { listTransfersInTransitWithItems } from "@/server/movements";
import { listActiveProductVariants } from "@/server/product-variants";
import { requireRole } from "@/server/profile";
import { listActiveWarehouses } from "@/server/warehouses";

type LegacyOperationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyOperationsPage({ searchParams }: LegacyOperationsPageProps) {
  const profile = await requireRole(["admin", "operator"]);
  const params = await searchParams;
  const selectedWarehouseId = typeof params.warehouseId === "string" ? params.warehouseId : null;

  const [warehouses, variants, inTransitTransfers] = await Promise.all([
    listActiveWarehouses(),
    listActiveProductVariants(),
    listTransfersInTransitWithItems(),
  ]);

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Consola operativa (actual)</h2>
      <p className="text-slate-600">Compatibilidad temporal mientras se migran los flujos dedicados por tarea.</p>
      {selectedWarehouse ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          Contexto recibido desde hub: {selectedWarehouse.code} - {selectedWarehouse.name}
        </p>
      ) : null}
      <OperationsConsole
        warehouses={warehouses}
        variants={variants}
        inTransitTransfers={inTransitTransfers}
        canCreateAdjustment={profile.role === "admin"}
      />
    </section>
  );
}
