import { requireRole } from "@/server/profile";
import { listTransfersInTransit } from "@/server/movements";
import { listActiveProductVariants } from "@/server/product-variants";
import { listActiveWarehouses } from "@/server/warehouses";
import { OperationsConsole } from "@/app/(dashboard)/operations/operations-console";

export default async function OperationsPage() {
  const profile = await requireRole(["admin", "operator"]);
  const [warehouses, variants, inTransitTransfers] = await Promise.all([
    listActiveWarehouses(),
    listActiveProductVariants(),
    listTransfersInTransit(),
  ]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Operaciones</h2>
      <p className="text-slate-600">Modulo operativo conectado a RPC transaccionales para entradas, salidas, transferencias y recepcion.</p>
      <OperationsConsole
        warehouses={warehouses}
        variants={variants}
        inTransitTransfers={inTransitTransfers}
        canCreateAdjustment={profile.role === "admin"}
      />
    </section>
  );
}
