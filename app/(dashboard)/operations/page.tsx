import { requireRole } from "@/server/profile";

export default async function OperationsPage() {
  await requireRole(["admin", "operator"]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Operaciones</h2>
      <p className="text-slate-600">Modulo operativo listo para integrar entradas, salidas, transferencias y recepcion.</p>
    </section>
  );
}
