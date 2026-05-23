"use client";

import { useState } from "react";
import { StockAdjustmentModal } from "./stock-adjustment-modal";

type StockRow = {
  warehouse_id: string;
  warehouse_name: string;
  product_variant_id: string;
  product_variant_name: string;
  sku: string | null;
  stock: number;
};

type StockTableProps = {
  stockRows: StockRow[];
  canAdjust?: boolean;
};

export function StockTable({ stockRows, canAdjust }: StockTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StockRow | null>(null);

  const openAdjustment = (row: StockRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Almacen</th>
              <th className="px-3 py-2 font-medium">Variante</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.length === 0 ? (
              <tr className="border-t border-slate-200">
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                  No hay filas de stock para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              stockRows.map((row) => (
                <tr key={`${row.warehouse_id}-${row.product_variant_id}`} className="border-t border-slate-200">
                  <td className="px-3 py-3 text-sm text-slate-800">{row.warehouse_name}</td>
                  <td className="px-3 py-3 text-sm text-slate-800">{row.product_variant_name}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{row.sku ?? "-"}</td>
                  <td className="px-3 py-3">
                    <span className={`font-semibold ${row.stock < 0 ? "text-amber-600" : "text-slate-900"}`}>
                      {Number(row.stock).toFixed(3)}
                    </span>
                    {row.stock < 0 && (
                      <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Negativo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {canAdjust && (
                      <button
                        onClick={() => openAdjustment(row)}
                        className="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Ajustar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <StockAdjustmentModal
          isOpen={modalOpen}
          onClose={handleClose}
          warehouseId={selectedRow.warehouse_id}
          warehouseName={selectedRow.warehouse_name}
          variantId={selectedRow.product_variant_id}
          variantName={selectedRow.product_variant_name}
          currentStock={selectedRow.stock}
        />
      )}
    </>
  );
}