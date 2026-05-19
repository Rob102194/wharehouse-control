"use client";

import { useActionState, useEffect, useState } from "react";
import { createExitAction, type OperationActionState } from "@/app/(dashboard)/operations/actions";
import {
  OperationActionFeedback,
  OperationSubmitButton,
} from "@/app/(dashboard)/operations/components/operation-form-feedback";
import {
  OperationLineItemsForm,
  type OperationItemRow,
} from "@/app/(dashboard)/operations/components/operation-line-items-form";
import { useStockCheck, StockWarnings } from "@/app/(dashboard)/operations/components/stock-warnings";
import type { ProductVariant } from "@/types/product-variant";
import type { Warehouse } from "@/types/warehouse";

type DispatchProductionFormProps = {
  warehouse: Warehouse;
  variants: ProductVariant[];
};

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

export function DispatchProductionForm({ warehouse, variants }: DispatchProductionFormProps) {
  const [state, formAction] = useActionState(createExitAction, initialState);
  const [items, setItems] = useState<OperationItemRow[]>([]);

  const { warnings } = useStockCheck({
    warehouseId: warehouse.id,
    items,
    variants,
  });

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
      <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
        Almacen origen activo: {warehouse.code} - {warehouse.name}
      </div>

      <input type="hidden" name="origin_warehouse_id" value={warehouse.id} />

      <OperationLineItemsForm
        title="Lineas para elaboracion"
        variants={variants}
        items={items}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
        lineErrors={state.lineErrors}
        emptyMessage="Busca y selecciona productos para elaboracion."
      />

      <StockWarnings warnings={warnings} />

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota de elaboracion (opcional)</span>
        <input
          name="notes"
          placeholder="Lote, turno o referencia"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Confirmar salida" pendingLabel="Registrando salida..." />
    </form>
  );
}
