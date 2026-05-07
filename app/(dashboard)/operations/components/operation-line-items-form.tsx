"use client";

import { useMemo } from "react";
import type { OperationActionState } from "@/app/(dashboard)/operations/actions";
import { FieldError } from "@/app/(dashboard)/operations/components/operation-form-feedback";
import type { ProductVariant } from "@/types/product-variant";

export type OperationLineItemDraft = {
  id: string;
  productVariantId: string;
  quantity: string;
  query: string;
};

type OperationLineItemsFormProps = {
  title: string;
  quantityLabel: string;
  addButtonLabel: string;
  variants: ProductVariant[];
  items: OperationLineItemDraft[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, field: "productVariantId" | "quantity" | "query", value: string) => void;
  lineErrors?: OperationActionState["lineErrors"];
};

function buildMovementItemsJson(items: OperationLineItemDraft[]) {
  return JSON.stringify(
    items
      .filter((item) => item.productVariantId && Number(item.quantity) > 0)
      .map((item) => ({
        product_variant_id: item.productVariantId,
        quantity: Number(item.quantity),
      })),
  );
}

export function OperationLineItemsForm({
  title,
  quantityLabel,
  addButtonLabel,
  variants,
  items,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  lineErrors,
}: OperationLineItemsFormProps) {
  const variantOptions = useMemo(
    () =>
      variants
        .map((variant) => ({
          id: variant.id,
          label: `${variant.product_name} - ${variant.name}${variant.sku ? ` (${variant.sku})` : ""}`,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "es")),
    [variants],
  );

  const variantLabelById = useMemo(() => new Map(variantOptions.map((option) => [option.id, option.label])), [variantOptions]);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {items.map((item, index) => {
        const variantError = lineErrors?.find((error) => error.rowIndex === index && error.field === "productVariantId")?.message;
        const quantityError = lineErrors?.find((error) => error.rowIndex === index && error.field === "quantity")?.message;

        return (
          <div key={item.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_170px_auto] md:items-end">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Variante #{index + 1}</span>
              <input
                type="text"
                value={item.query}
                onChange={(event) => onUpdateRow(item.id, "query", event.target.value)}
                placeholder="Buscar por nombre o SKU"
                className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <select
                value={item.productVariantId}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  onUpdateRow(item.id, "productVariantId", selectedId);
                  if (selectedId) {
                    onUpdateRow(item.id, "query", variantLabelById.get(selectedId) ?? "");
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
                min={0.001}
                step="0.001"
                value={item.quantity}
                onChange={(event) => onUpdateRow(item.id, "quantity", event.target.value)}
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
              onClick={() => onRemoveRow(item.id)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Quitar
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onAddRow}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        {addButtonLabel}
      </button>

      <input type="hidden" name="items_json" value={buildMovementItemsJson(items)} />
    </div>
  );
}
