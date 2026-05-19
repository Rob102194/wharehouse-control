"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { quickStockAdjustmentAction } from "@/app/(dashboard)/stock/actions";
import { Modal } from "@/app/(dashboard)/components/modal";

type StockAdjustmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  warehouseName: string;
  variantId: string;
  variantName: string;
  currentStock: number;
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
      {pending ? "Guardando..." : "Confirmar ajuste"}
    </button>
  );
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  warehouseId,
  warehouseName,
  variantId,
  variantName,
  currentStock,
}: StockAdjustmentModalProps) {
  const [state, formAction] = useActionState(quickStockAdjustmentAction, initialState);

  const handleSuccess = () => {
    if (state.ok) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Ajustar stock">
      <form action={formAction} onSubmit={() => setTimeout(handleSuccess, 100)} className="space-y-4">
        <input type="hidden" name="warehouse_id" value={warehouseId} />
        <input type="hidden" name="product_variant_id" value={variantId} />

        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="font-medium text-slate-700">Almacén: {warehouseName}</div>
          <div className="text-slate-600">Variante: {variantName}</div>
          <div className="mt-1 font-semibold text-slate-900">
            Stock actual: {Number(currentStock).toFixed(3)}
          </div>
        </div>

        <div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Nuevo stock</span>
            <input
              name="new_stock"
              type="number"
              step="0.001"
              min="0"
              defaultValue={currentStock}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Razón del ajuste</span>
            <textarea
              name="reason"
              rows={2}
              required
              placeholder="Ej: Conteo físico, producto dañado, corrección de error..."
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
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <SubmitButton />
        </div>
      </form>
    </Modal>
  );
}