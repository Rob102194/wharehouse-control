import Link from "next/link";
import { AdjustmentForm } from "@/app/(dashboard)/operations/adjustment/adjustment-form";
import { listActiveProductVariants } from "@/server/product-variants";
import { requireRole } from "@/server/profile";
import { listActiveWarehouses } from "@/server/warehouses";

type AdjustmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdjustmentPage({ searchParams }: AdjustmentPageProps) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const selectedWarehouseId = typeof params.warehouseId === "string" ? params.warehouseId : "";

  const [warehouses, variants] = await Promise.all([listActiveWarehouses(), listActiveProductVariants()]);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Ajuste administrativo</h2>
          <p className="text-slate-600">Correccion controlada de stock en el almacen activo (solo admin).</p>
        </div>
        <Link
          href={selectedWarehouseId ? `/operations?warehouseId=${encodeURIComponent(selectedWarehouseId)}` : "/operations"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          Volver al hub
        </Link>
      </div>

      {selectedWarehouse ? (
        <AdjustmentForm warehouseId={selectedWarehouse.id} warehouseLabel={`${selectedWarehouse.code} - ${selectedWarehouse.name}`} variants={variants} />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No hay un almacen activo valido. Regresa al hub y selecciona un almacen para continuar.
        </div>
      )}
    </section>
  );
}
