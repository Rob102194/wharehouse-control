import { requireRole } from "@/server/profile";

export default async function HistoryPage() {
  await requireRole(["admin", "operator", "owner"]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Historial</h2>
      <p className="text-slate-600">Pantalla base para filtros y consulta de movimientos auditables.</p>
    </section>
  );
}
