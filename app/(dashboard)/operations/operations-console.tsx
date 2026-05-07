"use client";

import { useActionState, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  createAdjustmentAction,
  createEntryAction,
  createExitAction,
  createTransferAction,
  receiveTransferAction,
  type OperationActionState,
} from "@/app/(dashboard)/operations/actions";
import {
  FieldError,
  OperationActionFeedback,
  OperationSubmitButton,
} from "@/app/(dashboard)/operations/components/operation-form-feedback";
import type { TransferInTransitWithItems } from "@/types/movement";
import type { ProductVariant } from "@/types/product-variant";
import type { Warehouse } from "@/types/warehouse";

type OperationsConsoleProps = {
  warehouses: Warehouse[];
  variants: ProductVariant[];
  inTransitTransfers: TransferInTransitWithItems[];
  canCreateAdjustment: boolean;
};

type LineItemDraft = {
  id: string;
  productVariantId: string;
  quantity: string;
  query: string;
  dispatchedQuantity?: number;
};

type LineValidationError = NonNullable<OperationActionState["lineErrors"]>[number];

const initialState: OperationActionState = {
  ok: false,
  message: "",
};

function parseQuantity(value: string) {
  const quantity = Number(value);
  if (Number.isNaN(quantity)) {
    return null;
  }

  return quantity;
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
  lineErrors,
}: {
  variants: ProductVariant[];
  quantityLabel: string;
  quantityMin: number;
  lineErrors?: LineValidationError[];
}) {
  const [items, setItems] = useState<LineItemDraft[]>([{ id: crypto.randomUUID(), productVariantId: "", quantity: "", query: "" }]);
  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: `${variant.product_name} - ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
      })),
    [variants],
  );
  const variantLabelById = useMemo(() => new Map(variantOptions.map((option) => [option.id, option.label])), [variantOptions]);

  const addRow = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productVariantId: "", quantity: "", query: "" }]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateRow = (id: string, field: "productVariantId" | "quantity" | "query", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const variantError = lineErrors?.find((error) => error.rowIndex === index && error.field === "productVariantId")?.message;
        const quantityError = lineErrors?.find((error) => error.rowIndex === index && error.field === "quantity")?.message;

        return (
        <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_150px_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Variante #{index + 1}</span>
            <input
              type="text"
              value={item.query}
              onChange={(event) => updateRow(item.id, "query", event.target.value)}
              placeholder="Buscar por nombre o SKU"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <select
              value={item.productVariantId}
              onChange={(event) => {
                const selectedId = event.target.value;
                updateRow(item.id, "productVariantId", selectedId);
                if (selectedId) {
                  updateRow(item.id, "query", variantLabelById.get(selectedId) ?? "");
                }
              }}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                variantError
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
              }`}
            >
              <option value="">Selecciona variante</option>
              {variantOptions
                .filter((option) => option.label.toLowerCase().includes(item.query.toLowerCase()))
                .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
                ))}
            </select>
            <FieldError message={variantError} />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">{quantityLabel}</span>
            <input
              type="number"
              min={quantityMin}
              step="0.001"
              value={item.quantity}
              onChange={(event) => updateRow(item.id, "quantity", event.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                quantityError
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
              }`}
            />
            <FieldError message={quantityError} />
          </label>

          <button
            type="button"
            onClick={() => removeRow(item.id)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Quitar
          </button>
        </div>
      );})}

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

function ReceiptItemsBuilder({
  variants,
  items,
  setItems,
  lineErrors,
}: {
  variants: ProductVariant[];
  items: LineItemDraft[];
  setItems: Dispatch<SetStateAction<LineItemDraft[]>>;
  lineErrors?: LineValidationError[];
}) {
  const variantOptions = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        label: `${variant.product_name} - ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
      })),
    [variants],
  );
  const variantLabelById = useMemo(() => new Map(variantOptions.map((option) => [option.id, option.label])), [variantOptions]);

  const addRow = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productVariantId: "", quantity: "", query: "" }]);
  };

  const removeRow = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const updateRow = (id: string, field: "productVariantId" | "quantity" | "query", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const variantError = lineErrors?.find((error) => error.rowIndex === index && error.field === "productVariantId")?.message;
        const quantityError = lineErrors?.find((error) => error.rowIndex === index && error.field === "quantity")?.message;

        return (
        <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Variante recibida #{index + 1}</span>
            <input
              type="text"
              value={item.query}
              onChange={(event) => updateRow(item.id, "query", event.target.value)}
              placeholder="Buscar por nombre o SKU"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <select
              value={item.productVariantId}
              onChange={(event) => {
                const selectedId = event.target.value;
                updateRow(item.id, "productVariantId", selectedId);
                if (selectedId) {
                  updateRow(item.id, "query", variantLabelById.get(selectedId) ?? "");
                }
              }}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                variantError
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
              }`}
            >
              <option value="">Selecciona variante</option>
              {variantOptions
                .filter((option) => option.label.toLowerCase().includes(item.query.toLowerCase()))
                .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
                ))}
            </select>
            <FieldError message={variantError} />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Cantidad recibida</span>
            <input
              type="number"
              min={0}
              step="0.001"
              value={item.quantity}
              onChange={(event) => updateRow(item.id, "quantity", event.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                quantityError
                  ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
              }`}
            />
            <span className="text-xs text-slate-500">
              Despachado: {item.dispatchedQuantity?.toFixed(3) ?? "-"}
            </span>
            <FieldError message={quantityError} />
          </label>

          <button
            type="button"
            onClick={() => removeRow(item.id)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Quitar
          </button>
        </div>
      );})}

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
          className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
            state.fieldErrors?.destination_warehouse_id
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
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
        <FieldError message={state.fieldErrors?.destination_warehouse_id} />
      </label>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} lineErrors={state.lineErrors} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Crear entrada" pendingLabel="Creando entrada..." />
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
          className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
            state.fieldErrors?.origin_warehouse_id
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
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
        <FieldError message={state.fieldErrors?.origin_warehouse_id} />
      </label>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} lineErrors={state.lineErrors} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Crear salida" pendingLabel="Creando salida..." />
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
            className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
              state.fieldErrors?.origin_warehouse_id
                ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
            }`}
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
          <FieldError message={state.fieldErrors?.origin_warehouse_id} />
        </label>
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
              Selecciona almacen
            </option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.destination_warehouse_id} />
        </label>
      </div>
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} lineErrors={state.lineErrors} />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota (opcional)</span>
        <input
          name="notes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <OperationActionFeedback state={state} />
      <OperationSubmitButton label="Crear transferencia" pendingLabel="Creando transferencia..." />
    </form>
  );
}

function ReceiveTransferForm({
  variants,
  inTransitTransfers,
}: {
  variants: ProductVariant[];
  inTransitTransfers: TransferInTransitWithItems[];
}) {
  const [state, formAction] = useActionState(receiveTransferAction, initialState);
  const [selectedTransferId, setSelectedTransferId] = useState("");
  const [items, setItems] = useState<LineItemDraft[]>([{ id: crypto.randomUUID(), productVariantId: "", quantity: "", query: "" }]);
  const [clientErrorState, setClientErrorState] = useState<OperationActionState | null>(null);

  const selectedTransfer = useMemo(
    () => inTransitTransfers.find((transfer) => transfer.id === selectedTransferId) ?? null,
    [inTransitTransfers, selectedTransferId],
  );

  useEffect(() => {
    if (!selectedTransfer || selectedTransfer.items.length === 0) {
      setItems([{ id: crypto.randomUUID(), productVariantId: "", quantity: "", query: "" }]);
      return;
    }

    setItems(
      selectedTransfer.items.map((item) => ({
        id: crypto.randomUUID(),
        productVariantId: item.product_variant_id,
        quantity: String(item.quantity),
        query: `${item.product_variant_name}${item.sku ? ` (${item.sku})` : ""}`,
        dispatchedQuantity: item.quantity,
      })),
    );
  }, [selectedTransfer]);

  const receiptValidation = useMemo(() => {
    if (!selectedTransfer) {
      return {
        valid: false,
        state: {
          ok: false,
          message: "Selecciona una transferencia en transito.",
          fieldErrors: { movement_id: "Selecciona una transferencia en transito." },
        } satisfies OperationActionState,
      };
    }

    if (items.length === 0) {
      return {
        valid: false,
        state: {
          ok: false,
          message: "Debes incluir al menos una linea de recepcion.",
        } satisfies OperationActionState,
      };
    }

    const lineErrors: LineValidationError[] = [];

    items.forEach((item, rowIndex) => {
      if (!item.productVariantId) {
        lineErrors.push({
          rowIndex,
          field: "productVariantId",
          message: "Selecciona una variante en esta linea.",
        });
      }

      const receivedQty = parseQuantity(item.quantity);
      if (receivedQty === null || receivedQty < 0) {
        lineErrors.push({
          rowIndex,
          productVariantId: item.productVariantId || undefined,
          field: "quantity",
          message: receivedQty === null ? "Ingresa una cantidad valida." : "La cantidad recibida no puede ser negativa.",
        });
      }

      if (item.dispatchedQuantity !== undefined && receivedQty !== null && receivedQty > item.dispatchedQuantity) {
        lineErrors.push({
          rowIndex,
          productVariantId: item.productVariantId || undefined,
          field: "quantity",
          message: "La cantidad recibida no puede superar la despachada.",
        });
      }
    });

    if (lineErrors.length > 0) {
      return {
        valid: false,
        state: {
          ok: false,
          message: "Revisa las lineas de recepcion marcadas.",
          lineErrors,
        } satisfies OperationActionState,
      };
    }

    return {
      valid: true,
      state: { ok: true, message: "" } satisfies OperationActionState,
    };
  }, [items, selectedTransfer]);

  const totals = useMemo(() => {
    const dispatched = items.reduce((acc, item) => acc + (item.dispatchedQuantity ?? 0), 0);
    const received = items.reduce((acc, item) => acc + Math.max(parseQuantity(item.quantity) ?? 0, 0), 0);
    return {
      dispatched,
      received,
      difference: dispatched - received,
    };
  }, [items]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!receiptValidation.valid) {
          event.preventDefault();
          setClientErrorState(receiptValidation.state);
          return;
        }

        setClientErrorState(null);
      }}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-base font-semibold text-slate-900">Recepcion de transferencia</h3>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Transferencia en transito</span>
        <select
          name="movement_id"
          required
          value={selectedTransferId}
          onChange={(event) => setSelectedTransferId(event.target.value)}
          className={`w-full rounded-lg px-3 py-2 font-mono text-xs outline-none transition focus:ring-2 ${
            clientErrorState?.fieldErrors?.movement_id || state.fieldErrors?.movement_id
              ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
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
        <FieldError message={clientErrorState?.fieldErrors?.movement_id ?? state.fieldErrors?.movement_id} />
      </label>
      {selectedTransfer ? (
        <div className="space-y-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p>
            Origen: {selectedTransfer.origin_warehouse_name ?? selectedTransfer.origin_warehouse_id} | Destino:{" "}
            {selectedTransfer.destination_warehouse_name ?? selectedTransfer.destination_warehouse_id}
          </p>
          <p>
            Lineas: {selectedTransfer.items.length} | Despachado total: {totals.dispatched.toFixed(3)} | Recibido total: {totals.received.toFixed(3)}
          </p>
          {selectedTransfer.notes ? <p>Nota de despacho: {selectedTransfer.notes}</p> : null}
          {totals.difference > 0 ? <p className="text-amber-700">Diferencia pendiente: {totals.difference.toFixed(3)}</p> : null}
        </div>
      ) : null}
      <ReceiptItemsBuilder
        variants={variants}
        items={items}
        setItems={setItems}
        lineErrors={clientErrorState?.lineErrors ?? state.lineErrors}
      />
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nota de incidente (opcional)</span>
        <input
          name="incident_note"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <OperationActionFeedback state={state} />
      {clientErrorState?.message && !clientErrorState.fieldErrors && !clientErrorState.lineErrors ? (
        <p className="text-sm text-red-600">{clientErrorState.message}</p>
      ) : null}
      <OperationSubmitButton label="Confirmar recepcion" pendingLabel="Confirmando recepcion..." />
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
            className={`w-full rounded-lg px-3 py-2 outline-none transition focus:ring-2 ${
              state.fieldErrors?.warehouse_id
                ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
            }`}
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
          <FieldError message={state.fieldErrors?.warehouse_id} />
        </label>
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
      <LineItemsBuilder variants={variants} quantityLabel="Cantidad" quantityMin={0.001} lineErrors={state.lineErrors} />
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
