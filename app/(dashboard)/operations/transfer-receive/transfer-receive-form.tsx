"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { receiveTransferAction, type OperationActionState } from "@/app/(dashboard)/operations/actions";
import {
  FieldError,
  OperationActionFeedback,
  OperationSubmitButton,
} from "@/app/(dashboard)/operations/components/operation-form-feedback";
import type { TransferInTransitWithItems } from "@/types/movement";
import type { Warehouse } from "@/types/warehouse";

type TransferReceiveFormProps = {
  warehouse: Warehouse;
  transfer: TransferInTransitWithItems;
  warehouseId: string;
  nextTransferId: string | null;
};

type ReceiptLineDraft = {
  id: string;
  productVariantId: string;
  productVariantName: string;
  dispatchedQuantity: number;
  quantity: string;
};

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

function buildReceiptItemsJson(items: ReceiptLineDraft[]) {
  return JSON.stringify(
    items.map((item) => ({
      product_variant_id: item.productVariantId,
      received_quantity: Number(item.quantity),
    })),
  );
}

export function TransferReceiveForm({ warehouse, transfer, warehouseId, nextTransferId }: TransferReceiveFormProps) {
  const [state, formAction] = useActionState(receiveTransferAction, initialState);
  const router = useRouter();
  const [items, setItems] = useState<ReceiptLineDraft[]>([]);

  useEffect(() => {
    setItems(
      transfer.items.map((item) => ({
        id: crypto.randomUUID(),
        productVariantId: item.product_variant_id,
        productVariantName: `${item.product_variant_name}${item.sku ? ` (${item.sku})` : ""}`,
        dispatchedQuantity: item.quantity,
        quantity: String(item.quantity),
      })),
    );
  }, [transfer]);

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    setItems(
      transfer.items.map((item) => ({
        id: crypto.randomUUID(),
        productVariantId: item.product_variant_id,
        productVariantName: `${item.product_variant_name}${item.sku ? ` (${item.sku})` : ""}`,
        dispatchedQuantity: item.quantity,
        quantity: String(item.quantity),
      })),
    );
  }, [transfer, state.ok]);

  const dispatchedByVariantId = useMemo(() => {
    return new Map(transfer.items.map((item) => [item.product_variant_id, item.quantity]));
  }, [transfer]);

  const clientLineErrors = useMemo(() => {
    return items.flatMap((item, index) => {
      const quantity = Number(item.quantity);
      const errors: Array<{ rowIndex: number; message: string }> = [];

      if (Number.isNaN(quantity)) {
        errors.push({ rowIndex: index, message: "Ingresa una cantidad valida." });
        return errors;
      }

      if (quantity < 0) {
        errors.push({ rowIndex: index, message: "La cantidad recibida no puede ser negativa." });
      }

      const dispatched = dispatchedByVariantId.get(item.productVariantId);
      if (typeof dispatched === "number" && quantity > dispatched) {
        errors.push({ rowIndex: index, message: "La cantidad recibida no puede superar la despachada." });
      }

      return errors;
    });
  }, [dispatchedByVariantId, items]);

  const hasClientErrors = items.length === 0 || clientLineErrors.length > 0;

  useEffect(() => {
    if (!state.ok) {
      return;
    }

    const baseHref = `/operations/transfer-receive?warehouseId=${encodeURIComponent(warehouseId)}`;
    const href = nextTransferId ? `${baseHref}&transferId=${encodeURIComponent(nextTransferId)}` : baseHref;
    router.replace(href);
    router.refresh();
  }, [nextTransferId, router, state.ok, warehouseId]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
        Almacen destino activo: {warehouse.code} - {warehouse.name}
      </div>

      <input type="hidden" name="movement_id" value={transfer.id} />
      <FieldError message={state.fieldErrors?.movement_id} />

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p>
          Transferencia: <span className="font-medium text-slate-900">{transfer.id}</span>
        </p>
        <p>
          Origen: <span className="font-medium text-slate-900">{transfer.origin_warehouse_name ?? transfer.origin_warehouse_id}</span>
        </p>
        <p>
          Despachada: <span className="font-medium text-slate-900">{new Date(transfer.created_at).toLocaleString("es-ES")}</span>
        </p>
        {transfer.notes ? <p>Nota: {transfer.notes}</p> : null}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Lineas a recibir</h3>
        {items.map((item, index) => {
          const quantityError = state.lineErrors?.find((error) => error.rowIndex === index && error.field === "quantity")?.message;
          const clientQuantityError = clientLineErrors.find((error) => error.rowIndex === index)?.message;

          return (
            <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_170px] md:items-end">
              <div className="space-y-1 text-sm">
                <p className="font-medium text-slate-700">{item.productVariantName}</p>
                <p className="text-xs text-slate-500">Despachado: {item.dispatchedQuantity.toFixed(3)}</p>
              </div>

              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Cantidad recibida</span>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={item.quantity}
                  onChange={(event) => {
                    const value = event.target.value;
                    setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, quantity: value } : row)));
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                    quantityError || clientQuantityError
                      ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                  }`}
                />
                <FieldError message={clientQuantityError ?? quantityError} />
              </label>
            </div>
          );
        })}
      </div>

      <input type="hidden" name="items_json" value={buildReceiptItemsJson(items)} />

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Incidencia (opcional)</span>
        <textarea
          name="incident_note"
          rows={3}
          placeholder="Describe diferencias o incidencias de recepcion"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <OperationActionFeedback state={state} />
      <OperationSubmitButton
        label="Confirmar recepcion"
        pendingLabel="Confirmando recepcion..."
        disabled={hasClientErrors}
      />
      {hasClientErrors ? <p className="text-xs text-slate-500">Revisa las cantidades antes de confirmar.</p> : null}
    </form>
  );
}
