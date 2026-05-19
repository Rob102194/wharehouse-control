"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateMovementAction } from "./actions";

type MovementItem = {
  id: string;
  product_variant_id: string;
  product_variant_name: string;
  sku: string | null;
  quantity: number;
};

type MovementWithItems = {
  id: string;
  movement_type: string;
  status: string;
  origin_warehouse_id: string | null;
  destination_warehouse_id: string | null;
  adjustment_direction: string | null;
  adjustment_reason: string | null;
  notes: string | null;
  incident_note: string | null;
  created_by: string;
  created_at: string;
  confirmed_at: string | null;
  received_by: string | null;
  received_at: string | null;
  items: MovementItem[];
};

type Warehouse = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

type MovementEditFormProps = {
  movement: MovementWithItems;
  warehouses: Warehouse[];
};

type ActionState = {
  ok: boolean;
  message: string;
};

const initialState: ActionState = {
  ok: false,
  message: "",
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

export function MovementEditForm({ movement, warehouses }: MovementEditFormProps) {
  const [state, formAction] = useActionState(updateMovementAction, initialState);

  const originWarehouse = movement.origin_warehouse_id
    ? warehouses.find((w) => w.id === movement.origin_warehouse_id)
    : null;
  const destWarehouse = movement.destination_warehouse_id
    ? warehouses.find((w) => w.id === movement.destination_warehouse_id)
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
            {movement.movement_type}
          </span>
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {movement.status}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Fecha original: <span className="font-medium">{new Date(movement.created_at).toLocaleString("es-ES")}</span>
        </p>
        {originWarehouse && (
          <p className="text-sm text-slate-600">
            Origen: <span className="font-medium">{originWarehouse.code} - {originWarehouse.name}</span>
          </p>
        )}
        {destWarehouse && (
          <p className="text-sm text-slate-600">
            Destino: <span className="font-medium">{destWarehouse.code} - {destWarehouse.name}</span>
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-slate-700">Items del movimiento</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {movement.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-sm text-slate-800">{item.product_variant_name}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{item.sku ?? "-"}</td>
                  <td className="px-3 py-2 text-sm text-slate-900 text-right font-medium">
                    {Number(item.quantity).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="movement_id" value={movement.id} />
        <input type="hidden" name="original_created_at" value={movement.created_at} />

        <div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Notas</span>
            <textarea
              name="notes"
              rows={2}
              defaultValue={movement.notes ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        {movement.movement_type === "adjustment" && (
          <div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Razón del ajuste</span>
              <textarea
                name="adjustment_reason"
                rows={2}
                defaultValue={movement.adjustment_reason ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
        )}

        {(movement.movement_type === "transfer" || movement.status === "received_with_incident") && (
          <div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Nota de incidencia</span>
              <textarea
                name="incident_note"
                rows={2}
                defaultValue={movement.incident_note ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
              placeholder="Obligatorio: explica por qué se edita este movimiento..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        {state.message && (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>
            {state.message}
          </p>
        )}

        <div className="flex justify-between">
          <a
            href="/history"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </a>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}