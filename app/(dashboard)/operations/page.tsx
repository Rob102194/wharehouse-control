import { listActiveWarehouses } from "@/server/warehouses";
import { requireRole } from "@/server/profile";
import { OperationsHub } from "@/app/(dashboard)/operations/operations-hub";

export default async function OperationsPage() {
  await requireRole(["admin", "operator"]);
  const warehouses = await listActiveWarehouses();

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">Operaciones</h2>
      <p className="text-slate-600">
        Selecciona un almacen activo para iniciar una tarea operativa. Este contexto aplica solo durante la sesion actual de
        navegacion.
      </p>
      <OperationsHub warehouses={warehouses} />
    </section>
  );
}
