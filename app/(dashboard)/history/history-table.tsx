"use client";

import Link from "next/link";
import type { MovementHistoryRow } from "@/types/movement";

type HistoryTableProps = {
  movements: MovementHistoryRow[];
};

export function HistoryTable({ movements }: HistoryTableProps) {
  return (
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
            <th className="px-3 py-2 font-medium">Notas</th>
            <th className="px-3 py-2 font-medium">Incidencia</th>
            <th className="px-3 py-2 font-medium">Ajuste</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium w-20">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movements.length === 0 ? (
            <tr className="border-t border-slate-200">
              <td colSpan={11} className="px-3 py-6 text-center text-sm text-slate-500">
                No hay movimientos para los filtros seleccionados.
              </td>
            </tr>
          ) : (
            movements.map((movement) => (
              <tr key={movement.id} className="border-t border-slate-200">
                <td className="px-3 py-3 text-sm text-slate-700">{new Date(movement.created_at).toLocaleString("es-ES")}</td>
                <td className="px-3 py-3 text-sm font-medium text-slate-900">{movement.movement_type}</td>
                <td className="px-3 py-3 text-sm text-slate-700">{movement.status}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{movement.origin_warehouse_name ?? "-"}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{movement.destination_warehouse_name ?? "-"}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{movement.actor_name}</td>
                <td className="max-w-40 truncate px-3 py-3 text-xs text-slate-600">{movement.notes ?? "-"}</td>
                <td className="max-w-40 truncate px-3 py-3 text-xs text-slate-600">{movement.incident_note ?? "-"}</td>
                <td className="max-w-44 truncate px-3 py-3 text-xs text-slate-600">
                  {movement.adjustment_reason
                    ? `${movement.adjustment_direction ?? ""}: ${movement.adjustment_reason}`
                    : "-"}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{movement.id.slice(0, 8)}...</td>
                <td className="px-3 py-3">
                  <Link
                    href={`/history/${movement.id}/edit`}
                    className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}