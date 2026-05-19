"use client";

import { useState } from "react";
import type { ProductStockSummary } from "@/server/stock";

type StockViewToggleProps = {
  summaries: ProductStockSummary[];
};

export function StockViewToggle({ summaries }: StockViewToggleProps) {
  const [view, setView] = useState<"variants" | "consolidated">("variants");

  const renderTotals = (totals: Record<string, number>) => {
    const entries = Object.entries(totals);
    if (entries.length === 0) {
      return <span className="text-slate-400">-</span>;
    }
    return entries.map(([unit, total]) => (
      <span key={unit} className="mr-2 rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
        {total.toFixed(2)} {unit}
      </span>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Vista:</span>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("variants")}
            className={`rounded-md px-3 py-1 text-sm transition ${
              view === "variants"
                ? "bg-brand-100 text-brand-800 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Por variante
          </button>
          <button
            type="button"
            onClick={() => setView("consolidated")}
            className={`rounded-md px-3 py-1 text-sm transition ${
              view === "consolidated"
                ? "bg-brand-100 text-brand-800 font-medium"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Consolidado
          </button>
        </div>
      </div>

      {view === "consolidated" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">Medible</th>
                <th className="px-3 py-2 font-medium">Variantes</th>
                <th className="px-3 py-2 font-medium">Totales</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                    No hay productos con stock.
                  </td>
                </tr>
              ) : (
                summaries.map((summary) => (
                  <tr key={summary.product_id} className="border-t border-slate-200">
                    <td className="px-3 py-3 text-sm font-medium text-slate-800">{summary.product_name}</td>
                    <td className="px-3 py-3 text-sm">
                      {summary.is_measurable ? (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Sí</span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">No</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {summary.variants.map((v, idx) => (
                          <span
                            key={`${v.variant_id}-${idx}`}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-xs"
                            title={`${v.stock} unidades`}
                          >
                            {v.variant_name} ({v.stock})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">{renderTotals(summary.total_by_secondary_unit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-slate-500">
          Usa los filtros y la tabla principal para ver el stock por variante.
        </div>
      )}
    </div>
  );
}