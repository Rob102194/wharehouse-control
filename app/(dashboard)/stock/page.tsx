import { requireRole } from "@/server/profile";

export default async function StockPage() {
  await requireRole(["admin", "operator", "owner"]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Stock actual</h2>
      <p className="text-slate-600">Aqui se conectara la vista de stock derivado desde movimientos confirmados.</p>
    </section>
  );
}
