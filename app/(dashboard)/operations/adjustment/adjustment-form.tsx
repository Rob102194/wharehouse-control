"use client";

import { useActionState, useEffect, useState } from "react";
import { createAdjustmentAction, type OperationActionState } from "@/app/(dashboard)/operations/actions";
import {
  FieldError,
  OperationActionFeedback,
  OperationSubmitButton,
} from "@/app/(dashboard)/operations/components/operation-form-feedback";
import {
  OperationLineItemsForm,
  type OperationItemRow,
} from "@/app/(dashboard)/operations/components/operation-line-items-form";
import type { ProductVariant } from "@/types/product-variant";

type AdjustmentFormProps = {
  warehouseId: string;
  warehouseLabel: string;
  variants: ProductVariant[];
};

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

export function AdjustmentForm({ warehouseId, warehouseLabel, variants }: AdjustmentFormProps) {
  const [state, formAction] = useActionState(createAdjustmentAction, initialState);
  const [items, setItems] = useState<OperationItemRow[]>([]);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    setItems([]);
  }, [state.ok]);

  const addItem = (variant: ProductVariant) => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productVariantId: variant.id, quantity: "1" }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Almacen de ajuste activo: {warehouseLabel}
      </div>

      <input type="hidden" name="warehouse_id" value={warehouseId} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Direccion</span>
          <select
            name="adjustment_direction"
            required
            defaultValue="positive"
            className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
              state.fieldErrors?.adjustment_direction
                ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
            }`}
          >
            <option value="positive">Ajuste positivo</option>
            <option value="negative">Ajuste negativo</option>
          </select>
          <FieldError message={state.fieldErrors?.adjustment_direction} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Razon del ajuste</span>
        <input
          name="adjustment_reason"
          required
          className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
            state.fieldErrors?.adjustment_reason
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        />
        <FieldError message={state.fieldErrors?.adjustment_reason} />
      </label>

      <OperationLineItemsForm
        title="Lineas del ajuste"
        variants={variants}
        items={items}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
        lineErrors={state.lineErrors}
        emptyMessage="Busca y selecciona productos para ajustar."
      />

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Crear ajuste" pendingLabel="Creando ajuste..." />
    </form>
  );
}
