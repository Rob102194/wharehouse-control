import { requireRole } from "@/server/profile";
import { listMovements } from "@/server/movements";

export default async function HistoryPage() {
  await requireRole(["admin", "operator", "owner"]);
  const movements = await listMovements(100);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Historial</h2>
      <p className="text-slate-600">Consulta de movimientos registrados en orden cronologico descendente.</p>

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
              <th className="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                  Sin movimientos registrados todavia.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 text-sm text-slate-700">{new Date(movement.created_at).toLocaleString("es-ES")}</td>
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{movement.movement_type}</td>
                  <td className="px-3 py-3 text-sm text-slate-700">{movement.status}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.origin_warehouse_id ?? "-"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.destination_warehouse_id ?? "-"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.created_by}</td>
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
