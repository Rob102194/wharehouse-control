"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createAdjustmentAction,
  createEntryAction,
  createExitAction,
  createTransferAction,
  receiveTransferAction,
  type OperationActionState,
} from "@/app/(dashboard)/operations/actions";
import type { TransferInTransit } from "@/types/movement";
import type { ProductVariant } from "@/types/product-variant";
import type { Warehouse } from "@/types/warehouse";

type OperationsConsoleProps = {
  warehouses: Warehouse[];
  variants: ProductVariant[];
  inTransitTransfers: TransferInTransit[];
  canCreateAdjustment: boolean;
};

type LineItemDraft = {
  id: string;
  productVariantId: string;
  quantity: string;
};

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ActionFeedback({ state }: { state: OperationActionState }) {
  if (!state.message) {
    return null;
  }

  return <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>;
}

function ReferenceLists({ warehouses, variants, inTransitTransfers }: Omit<OperationsConsoleProps, "canCreateAdjustment">) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Referencias operativas</h3>
      <p className="text-sm text-slate-600">Selecciona almacenes y variantes desde los formularios. IDs visibles para trazabilidad.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Almacenes activos</h4>
          <ul className="max-h-36 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2 text-xs text-slate-600">
            {warehouses.map((warehouse) => (
              <li key={warehouse.id}>
                <span className="font-medium text-slate-900">{warehouse.code}</span> - {warehouse.name}
                <br />
                <span className="text-slate-500">{warehouse.id}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Variantes activas</h4>
          <ul className="max-h-36 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2 text-xs text-slate-600">
            {variants.map((variant) => (
              <li key={variant.id}>
                <span className="font-medium text-slate-900">{variant.product_name} - {variant.name}</span>
                <br />
                <span className="text-slate-500">{variant.id}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-800">Transferencias en transito</h4>
          <ul className="max-h-36 space-y-1 overflow-auto rounded-lg border border-slate-200 p-2 text-xs text-slate-600">
            {inTransitTransfers.length === 0 ? (
              <li>Sin transferencias pendientes.</li>
            ) : (
              inTransitTransfers.map((transfer) => (
                <li key={transfer.id}>
                  <span className="font-medium text-slate-900">{transfer.id}</span>
                  <br />
                  <span className="text-slate-500">{new Date(transfer.created_at).toLocaleString("es-ES")}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function buildMovementItemsJson(items: LineItemDraft[]) {
  return JSON.stringify(
    items
      .filter((item) => item.productVariantId && Number(item.quantity) > 0)
      .map((item) => ({
        product_variant_id: item.productVariantId,
        quantity: Number(item.quantity),
      })),
  );
}

function buildReceiptItemsJson(items: LineItemDraft[]) {
  return JSON.stringify(
    items
      .filter((item) => item.productVariantId && Number(item.quantity) >= 0)
      .map((item) => ({
        product_variant_id: item.productVariantId,
        received_quantity: Number(item.quantity),
      })),
  );
}

function LineItemsBuilder({
  variants,
  quantityLabel,
  quantityMin,
}: {
  variants: ProductVariant[];
  quantityLabel: string;
  quantityMin: number;
}) {
  const [items, setItems] = useState<LineItemDraft[]>([{ id: crypto.randomUUID(), productVariantId: "", quantity: "" }]);
  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: `${variant.product_name} - ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
      })),
    [variants],
  );

  const addRow = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productVariantId: "", quantity: "" }]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateRow = (id: string, field: "productVariantId" | "quantity", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_150px_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Variante #{index + 1}</span>
            <select
              value={item.productVariantId}
              onChange={(event) => updateRow(item.id, "productVariantId", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Selecciona variante</option>
              {variantOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">{quantityLabel}</span>
            <input
              type="number"
              min={quantityMin}
              step="0.001"
              value={item.quantity}
              onChange={(event) => updateRow(item.id, "quantity", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <button
            type="button"
            onClick={() => removeRow(item.id)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        Agregar linea
      </button>

      <input type="hidden" name="items_json" value={buildMovementItemsJson(items)} />
    </div>
  );
}

function ReceiptItemsBuilder({ variants }: { variants: ProductVariant[] }) {
  const [items, setItems] = useState<LineItemDraft[]>([{ id: crypto.randomUUID(), productVariantId: "", quantity: "" }]);
  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: `${variant.product_name} - ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
      })),
    [variants],
  );

  const addRow = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productVariantId: "", quantity: "" }]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateRow = (id: string, field: "productVariantId" | "quantity", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Variante recibida #{index + 1}</span>
            <select
              value={item.productVariantId}
              onChange={(event) => updateRow(item.id, "productVariantId", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Selecciona variante</option>
              {variantOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Cantidad recibida</span>
            <input
              type="number"
              min={0}
              step="0.001"
              value={item.quantity}
              onChange={(event) => updateRow(item.id, "quantity", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <button
            type="button"
            onClick={() => removeRow(item.id)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        Agregar linea de recepcion
      </button>

      <input type="hidden" name="items_json" value={buildReceiptItemsJson(items)} />
    </div>
  );
}

function EntryForm({ warehouses, variants }: { warehouses: Warehouse[]; variants: ProductVariant[] }) {
  const [state, formAction] = useActionState(createEntryAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Entrada</h3>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Almacen destino</span>
        <select
          name="destination_warehouse_id"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            Selecciona almacen
          </option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} - {warehouse.name}
            </option>
          ))}
        </select>
      </label>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <ActionFeedback state={state} />
      <SubmitButton label="Crear entrada" pendingLabel="Creando entrada..." />
    </form>
  );
}

function ExitForm({ warehouses, variants }: { warehouses: Warehouse[]; variants: ProductVariant[] }) {
  const [state, formAction] = useActionState(createExitAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Salida</h3>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Almacen origen</span>
        <select
          name="origin_warehouse_id"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            Selecciona almacen
          </option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} - {warehouse.name}
            </option>
          ))}
        </select>
      </label>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <ActionFeedback state={state} />
      <SubmitButton label="Crear salida" pendingLabel="Creando salida..." />
    </form>
  );
}

function TransferForm({ warehouses, variants }: { warehouses: Warehouse[]; variants: ProductVariant[] }) {
  const [state, formAction] = useActionState(createTransferAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Transferencia</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Almacen origen</span>
          <select
            name="origin_warehouse_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="" disabled>
              Selecciona almacen
            </option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Almacen destino</span>
          <select
            name="destination_warehouse_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="" disabled>
              Selecciona almacen
            </option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <ActionFeedback state={state} />
      <SubmitButton label="Crear transferencia" pendingLabel="Creando transferencia..." />
    </form>
  );
}

function ReceiveTransferForm({ variants, inTransitTransfers }: { variants: ProductVariant[]; inTransitTransfers: TransferInTransit[] }) {
  const [state, formAction] = useActionState(receiveTransferAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Recepcion de transferencia</h3>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Transferencia en transito</span>
        <select
          name="movement_id"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        >
          <option value="" disabled>
            Selecciona transferencia
          </option>
          {inTransitTransfers.map((transfer) => (
            <option key={transfer.id} value={transfer.id}>
              {transfer.id}
            </option>
          ))}
        </select>
      </label>
      <ReceiptItemsBuilder variants={variants} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota de incidente (opcional)</span>
        <input
          name="incident_note"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <ActionFeedback state={state} />
      <SubmitButton label="Confirmar recepcion" pendingLabel="Confirmando recepcion..." />
    </form>
  );
}

function AdjustmentForm({ warehouses, variants }: { warehouses: Warehouse[]; variants: ProductVariant[] }) {
  const [state, formAction] = useActionState(createAdjustmentAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Ajuste admin</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Almacen</span>
          <select
            name="warehouse_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="" disabled>
              Selecciona almacen
            </option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-slate-700">Direccion</span>
          <select
            name="adjustment_direction"
            required
            defaultValue="positive"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="positive">Ajuste positivo</option>
            <option value="negative">Ajuste negativo</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Razon del ajuste</span>
        <input
          name="adjustment_reason"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <ActionFeedback state={state} />
      <SubmitButton label="Crear ajuste" pendingLabel="Creando ajuste..." />
    </form>
  );
}

export function OperationsConsole({ warehouses, variants, inTransitTransfers, canCreateAdjustment }: OperationsConsoleProps) {
  return (
    <div className="space-y-4">
      <ReferenceLists warehouses={warehouses} variants={variants} inTransitTransfers={inTransitTransfers} />

      <div className="grid gap-4 lg:grid-cols-2">
        <EntryForm warehouses={warehouses} variants={variants} />
        <ExitForm warehouses={warehouses} variants={variants} />
        <TransferForm warehouses={warehouses} variants={variants} />
        <ReceiveTransferForm variants={variants} inTransitTransfers={inTransitTransfers} />
        {canCreateAdjustment ? <AdjustmentForm warehouses={warehouses} variants={variants} /> : null}
      </div>
    </div>
  );
}
