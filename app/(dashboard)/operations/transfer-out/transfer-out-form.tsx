"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { createTransferAction, type OperationActionState } from "@/app/(dashboard)/operations/actions";
import {
  FieldError,
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

type TransferOutFormProps = {
  warehouse: Warehouse;
  warehouses: Warehouse[];
  variants: ProductVariant[];
};

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

export function TransferOutForm({ warehouse, warehouses, variants }: TransferOutFormProps) {
  const [state, formAction] = useActionState(createTransferAction, initialState);
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

  const destinationWarehouses = useMemo(
    () =>
      warehouses
        .filter((candidate) => candidate.id !== warehouse.id)
        .sort((a, b) => `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`, "es")),
    [warehouse.id, warehouses],
  );

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

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Almacen destino</span>
        <select
          name="destination_warehouse_id"
          required
          defaultValue=""
          className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
            state.fieldErrors?.destination_warehouse_id
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        >
          <option value="" disabled>
            Selecciona almacen destino
          </option>
          {destinationWarehouses.map((destination) => (
            <option key={destination.id} value={destination.id}>
              {destination.code} - {destination.name}
            </option>
          ))}
        </select>
        <FieldError message={state.fieldErrors?.destination_warehouse_id} />
      </label>

      <OperationLineItemsForm
        title="Lineas de transferencia"
        variants={variants}
        items={items}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
        lineErrors={state.lineErrors}
        emptyMessage="Busca y selecciona productos para transferir."
      />

      <StockWarnings warnings={warnings} />

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota de transferencia (opcional)</span>
        <input
          name="notes"
          placeholder="Referencia del traslado"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Confirmar transferencia" pendingLabel="Registrando transferencia..." />
    </form>
  );
}
