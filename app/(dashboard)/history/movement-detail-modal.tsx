"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateMovementFromModalAction, type ActionState } from "@/app/(dashboard)/history/actions";
import { Modal } from "@/app/(dashboard)/components/modal";
import type { MovementHistoryRow } from "@/types/movement";
import type { Warehouse } from "@/types/warehouse";

type MovementDetailModalProps = {
  movement: MovementHistoryRow | null;
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
};

const initialState: ActionState = {
  ok: false,
  message: "",
};

const MOVEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  entry: { label: "Compra", icon: "📦" },
  exit: { label: "Despacho", icon: "🚀" },
  transfer: { label: "Transferencia", icon: "↔️" },
  adjustment: { label: "Ajuste", icon: "✏️" },
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

export function MovementDetailModal({ movement, isOpen, onClose, warehouses }: MovementDetailModalProps) {
  const [state, formAction] = useActionState(updateMovementFromModalAction, initialState);
  const [localMovement, setLocalMovement] = useState<MovementHistoryRow | null>(null);

  useEffect(() => {
    if (movement) {
      setLocalMovement(movement);
    }
  }, [movement]);

  useEffect(() => {
    if (state.ok) {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  }, [state.ok, onClose]);

  if (!localMovement) {
    return null;
  }

  const typeInfo = MOVEMENT_LABELS[localMovement.movement_type] || { label: localMovement.movement_type, icon: "❓" };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const originWarehouse = localMovement.origin_warehouse_name
    ? warehouses.find((w) => localMovement.origin_warehouse_name?.includes(w.code))
    : null;
  const destWarehouse = localMovement.destination_warehouse_name
    ? warehouses.find((w) => localMovement.destination_warehouse_name?.includes(w.code))
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del movimiento" size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
            {typeInfo.icon} {typeInfo.label}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {localMovement.status}
          </span>
          {localMovement.is_incident && (
            <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              ⚠️ Incidencia
            </span>
          )}
          {localMovement.edit_count > 0 && (
            <span className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
              ✏️ Editado ({localMovement.edit_count})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">Fecha:</span>
            <p className="font-medium text-slate-800">{formatDate(localMovement.created_at)}</p>
          </div>
          <div>
            <span className="text-slate-500">Actor:</span>
            <p className="font-medium text-slate-800">{localMovement.actor_name}</p>
          </div>
          {originWarehouse && (
            <div>
              <span className="text-slate-500">Origen:</span>
              <p className="font-medium text-slate-800">{originWarehouse.code} - {originWarehouse.name}</p>
            </div>
          )}
          {destWarehouse && (
            <div>
              <span className="text-slate-500">Destino:</span>
              <p className="font-medium text-slate-800">{destWarehouse.code} - {destWarehouse.name}</p>
            </div>
          )}
        </div>

        {localMovement.adjustment_direction && (
          <div className="rounded-lg bg-amber-50 p-3">
            <span className="text-xs font-medium text-amber-700 uppercase">
              Ajuste {localMovement.adjustment_direction}
            </span>
            {localMovement.adjustment_reason && (
              <p className="mt-1 text-sm text-amber-800">{localMovement.adjustment_reason}</p>
            )}
          </div>
        )}

        {localMovement.notes && (
          <div className="rounded-lg bg-slate-50 p-3">
            <span className="text-xs font-medium text-slate-500">Notas</span>
            <p className="mt-1 text-sm text-slate-700">{localMovement.notes}</p>
          </div>
        )}

        {localMovement.incident_note && (
          <div className="rounded-lg bg-red-50 p-3">
            <span className="text-xs font-medium text-red-700">Incidencia</span>
            <p className="mt-1 text-sm text-red-800">{localMovement.incident_note}</p>
          </div>
        )}

        {localMovement.items.length > 0 && (
          <div className="rounded-lg border border-slate-200">
            <div className="bg-slate-50 px-3 py-2 text-xs font-medium uppercase text-slate-500">
              Productos ({localMovement.items.length})
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-t border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-3 py-1">Producto</th>
                    <th className="px-3 py-1">SKU</th>
                    <th className="px-3 py-1 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {localMovement.items.map((item, idx) => (
                    <tr key={`${item.product_variant_id}-${idx}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-sm text-slate-800">{item.product_variant_name}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{item.sku ?? "-"}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-slate-800">
                        {Number(item.quantity).toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <hr className="border-slate-200" />

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="movement_id" value={localMovement.id} />

          <div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Notas</span>
              <textarea
                name="notes"
                rows={2}
                defaultValue={localMovement.notes ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          {localMovement.movement_type === "adjustment" && (
            <div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Razón del ajuste</span>
                <textarea
                  name="adjustment_reason"
                  rows={2}
                  defaultValue={localMovement.adjustment_reason ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
          )}

          {(localMovement.movement_type === "transfer" || localMovement.is_incident) && (
            <div>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Nota de incidencia</span>
                <textarea
                  name="incident_note"
                  rows={2}
                  defaultValue={localMovement.incident_note ?? ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
          )}

          <div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Razón de edición</span>
              <textarea
                name="edit_reason"
                rows={2}
                required
                placeholder="Obligatorio: explica por qué se edita..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>

          {state.message && (
            <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>
              {state.message}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Modal>
  );
}