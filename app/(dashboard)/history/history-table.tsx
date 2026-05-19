"use client";

import { useState } from "react";
import type { MovementHistoryRow } from "@/types/movement";
import { MovementDetailModal } from "./movement-detail-modal";
import type { Warehouse } from "@/types/warehouse";

type HistoryTableProps = {
  movements: MovementHistoryRow[];
  warehouses: Warehouse[];
};

const MOVEMENT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  entry: { label: "Compra", icon: "📦", color: "bg-emerald-100 text-emerald-700" },
  exit: { label: "Despacho", icon: "🚀", color: "bg-blue-100 text-blue-700" },
  transfer: { label: "Transferencia", icon: "↔️", color: "bg-purple-100 text-purple-700" },
  adjustment: { label: "Ajuste", icon: "✏️", color: "bg-amber-100 text-amber-700" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MobileCard({ movement, onClick }: { movement: MovementHistoryRow; onClick: () => void }) {
  const typeInfo = MOVEMENT_LABELS[movement.movement_type] || { label: movement.movement_type, icon: "❓", color: "bg-slate-100 text-slate-700" };

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-sm md:hidden"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{formatDate(movement.created_at)}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
          {typeInfo.icon} {typeInfo.label}
        </span>
      </div>
      <div className="mt-2 text-sm">
        {movement.origin_warehouse_name && (
          <span className="text-slate-600">De: <span className="font-medium text-slate-800">{movement.origin_warehouse_name}</span></span>
        )}
        {movement.destination_warehouse_name && (
          <span className="ml-2 text-slate-600">→ A: <span className="font-medium text-slate-800">{movement.destination_warehouse_name}</span></span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1">
        {movement.is_incident && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">⚠️ Incidencia</span>
        )}
        {movement.edit_count > 0 && (
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">✏️ {movement.edit_count}</span>
        )}
      </div>
    </button>
  );
}

export function HistoryTable({ movements, warehouses }: HistoryTableProps) {
  const [selectedMovement, setSelectedMovement] = useState<MovementHistoryRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (movement: MovementHistoryRow) => {
    setSelectedMovement(movement);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMovement(null);
  };

  if (movements.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No hay movimientos para los filtros seleccionados.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Origen</th>
              <th className="px-3 py-2 font-medium">Destino</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => {
              const typeInfo = MOVEMENT_LABELS[movement.movement_type] || { label: movement.movement_type, icon: "❓", color: "bg-slate-100 text-slate-700" };
              return (
                <tr
                  key={movement.id}
                  onClick={() => openModal(movement)}
                  className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50"
                >
                  <td className="px-3 py-3 text-sm text-slate-700">{formatDate(movement.created_at)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.origin_warehouse_name ?? "-"}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {movement.destination_warehouse_name ?? "-"}
                    {movement.is_incident && (
                      <span className="ml-1 inline-block rounded bg-red-100 px-1 py-0.5 text-xs font-medium text-red-700">⚠️</span>
                    )}
                    {movement.edit_count > 0 && (
                      <span className="ml-1 inline-block rounded bg-slate-200 px-1 py-0.5 text-xs font-medium text-slate-600">
                        ✏️ {movement.edit_count}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{movement.actor_name}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{movement.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 md:hidden">
        {movements.map((movement) => (
          <MobileCard key={movement.id} movement={movement} onClick={() => openModal(movement)} />
        ))}
      </div>

      <MovementDetailModal
        movement={selectedMovement}
        isOpen={modalOpen}
        onClose={closeModal}
        warehouses={warehouses}
      />
    </>
  );
}