"use client";

import type { OperationActionState } from "@/app/(dashboard)/operations/actions";
import { FieldError } from "@/app/(dashboard)/operations/components/operation-form-feedback";
import type { ProductVariant } from "@/types/product-variant";

export type OperationItemRow = {
  id: string;
  productVariantId: string;
  quantity: string;
};

type OperationItemsTableProps = {
  items: OperationItemRow[];
  variants: ProductVariant[];
  onUpdateQuantity: (id: string, quantity: string) => void;
  onRemove: (id: string) => void;
  lineErrors?: OperationActionState["lineErrors"];
  emptyMessage?: string;
};

function getVariantInfo(variants: ProductVariant[], variantId: string) {
  const variant = variants.find((v) => v.id === variantId);
  if (!variant) return { productName: "Desconocido", variantName: "", sku: "-" };
  return {
    productName: variant.product_name,
    variantName: variant.name,
    sku: variant.sku || "-",
  };
}

export function OperationItemsTable({
  items,
  variants,
  onUpdateQuantity,
  onRemove,
  lineErrors,
  emptyMessage = "Agrega productos para continuar.",
}: OperationItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-700">Producto</th>
            <th className="hidden px-3 py-2 text-left font-medium text-slate-700 md:table-cell">SKU</th>
            <th className="px-3 py-2 text-center font-medium text-slate-700">Cantidad</th>
            <th className="px-3 py-2 text-center font-medium text-slate-700">Accion</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const info = getVariantInfo(variants, item.productVariantId);
            const variantError = lineErrors?.find(
              (error) => error.rowIndex === index && error.field === "productVariantId",
            )?.message;
            const quantityError = lineErrors?.find(
              (error) => error.rowIndex === index && error.field === "quantity",
            )?.message;
            const hasError = !!variantError || !!quantityError;

            return (
              <tr
                key={item.id}
                className={`border-b border-slate-100 last:border-b-0 ${
                  hasError ? "bg-red-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{info.productName}</div>
                  <div className="text-xs text-slate-500">{info.variantName}</div>
                  <FieldError message={variantError} />
                </td>
                <td className="hidden px-3 py-2 text-slate-600 md:table-cell">{info.sku}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-center">
                    <input
                      type="number"
                      min={0.001}
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                      className={`w-24 rounded-lg px-2 py-1 text-center text-sm outline-none transition focus:ring-2 ${
                        quantityError
                          ? "border border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border border-slate-300 focus:border-brand-500 focus:ring-brand-100"
                      }`}
                    />
                  </div>
                  <FieldError message={quantityError} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 transition hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                    >
                      Quitar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
