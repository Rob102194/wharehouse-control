"use client";

import { useState } from "react";
import type { OperationActionState } from "@/app/(dashboard)/operations/actions";
import { OperationItemsTable, type OperationItemRow } from "@/app/(dashboard)/operations/components/operation-items-table";
import { OperationProductPicker } from "@/app/(dashboard)/operations/components/operation-product-picker";

export type { OperationItemRow } from "@/app/(dashboard)/operations/components/operation-items-table";
import type { ProductVariant } from "@/types/product-variant";

type OperationLineItemsFormProps = {
  title: string;
  variants: ProductVariant[];
  items: OperationItemRow[];
  onAddItem: (variant: ProductVariant) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: string) => void;
  lineErrors?: OperationActionState["lineErrors"];
  emptyMessage?: string;
};

function buildMovementItemsJson(items: OperationItemRow[]) {
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
  variants,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  lineErrors,
  emptyMessage,
}: OperationLineItemsFormProps) {
  const [duplicateToast, setDuplicateToast] = useState(false);

  const selectedIds = items.map((item) => item.productVariantId);

  const handleSelect = (variant: ProductVariant) => {
    if (selectedIds.includes(variant.id)) {
      setDuplicateToast(true);
      setTimeout(() => setDuplicateToast(false), 2500);
      return;
    }
    onAddItem(variant);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>

      {duplicateToast && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Esta variante ya fue agregada a la operacion.
        </div>
      )}

      <OperationProductPicker
        variants={variants}
        selectedIds={selectedIds}
        onSelect={handleSelect}
      />

      <OperationItemsTable
        items={items}
        variants={variants}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemoveItem}
        lineErrors={lineErrors}
        emptyMessage={emptyMessage}
      />

      <input type="hidden" name="items_json" value={buildMovementItemsJson(items)} />
    </div>
  );
}
