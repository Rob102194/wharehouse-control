"use client";

import { useState, useEffect } from "react";
import type { OperationItemRow } from "@/app/(dashboard)/operations/components/operation-line-items-form";

type StockWarning = {
  variantId: string;
  variantName: string;
  currentStock: number;
  requestedQuantity: number;
  prospectiveStock: number;
};

type UseStockCheckOptions = {
  warehouseId: string;
  items: OperationItemRow[];
  variants: Array<{ id: string; name: string }>;
};

type UseStockCheckResult = {
  warnings: StockWarning[];
  loading: boolean;
};

export function useStockCheck({ warehouseId, items, variants }: UseStockCheckOptions): UseStockCheckResult {
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!warehouseId || variants.length === 0) {
      setStockMap(new Map());
      return;
    }

    const variantIds = variants.map((v) => v.id).join(",");
    const fetchStock = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-check?warehouse=${warehouseId}&variants=${variantIds}`
        );
        if (response.ok) {
          const data = await response.json();
          setStockMap(new Map(Object.entries(data)));
        }
      } catch (error) {
        console.error("Failed to fetch stock:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, variants.length]);

  const warnings: StockWarning[] = [];
  for (const item of items) {
    const currentStock = stockMap.get(item.productVariantId) ?? 0;
    const quantity = parseFloat(item.quantity) || 0;
    const prospectiveStock = currentStock - quantity;

    if (prospectiveStock < 0) {
      const variant = variants.find((v) => v.id === item.productVariantId);
      warnings.push({
        variantId: item.productVariantId,
        variantName: variant?.name ?? "Desconocido",
        currentStock,
        requestedQuantity: quantity,
        prospectiveStock,
      });
    }
  }

  return { warnings, loading };
}

export function StockWarnings({ warnings }: { warnings: StockWarning[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-700 font-medium text-sm">Stock negativo</span>
      </div>
      <ul className="space-y-1">
        {warnings.map((w) => (
          <li key={w.variantId} className="text-xs text-amber-800">
            <strong>{w.variantName}</strong>: stock actual {w.currentStock.toFixed(3)} - solicitado {w.requestedQuantity.toFixed(3)} ={" "}
            <span className="font-medium">{w.prospectiveStock.toFixed(3)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}