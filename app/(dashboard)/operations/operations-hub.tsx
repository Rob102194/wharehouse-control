"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Warehouse } from "@/types/warehouse";

type OperationsHubProps = {
  warehouses: Warehouse[];
  canCreateAdjustment: boolean;
};

type OperationCard = {
  title: string;
  description: string;
  hrefMode: string;
  hrefPath?: string;
};

const MAIN_FLOW_CARDS: OperationCard[] = [
  {
    title: "Recibir compra",
    description: "Entrada de mercaderia comprada al almacen activo.",
    hrefMode: "receive-purchase",
    hrefPath: "/operations/receive-purchase",
  },
  {
    title: "Despachar al restaurante",
    description: "Salida de inventario hacia cocina o area de consumo.",
    hrefMode: "dispatch-restaurant",
    hrefPath: "/operations/dispatch-restaurant",
  },
  {
    title: "Transferir a otro almacen",
    description: "Despacho entre almacenes con recepcion pendiente.",
    hrefMode: "transfer-out",
    hrefPath: "/operations/transfer-out",
  },
  {
    title: "Recibir transferencia",
    description: "Confirmacion de recepcion para transferencias en transito.",
    hrefMode: "transfer-receive",
    hrefPath: "/operations/transfer-receive",
  },
];

const SECONDARY_FLOW_CARDS: OperationCard[] = [
  {
    title: "Recibir devolucion restaurante",
    description: "Registrar devoluciones de producto al almacen activo.",
    hrefMode: "return-from-restaurant",
    hrefPath: "/operations/return-from-restaurant",
  },
  {
    title: "Despachar a elaboracion",
    description: "Salida de insumos para procesos de elaboracion.",
    hrefMode: "dispatch-production",
    hrefPath: "/operations/dispatch-production",
  },
  {
    title: "Recibir desde elaboracion",
    description: "Entrada de producto elaborado de vuelta a almacen.",
    hrefMode: "receive-from-production",
    hrefPath: "/operations/receive-from-production",
  },
];

export function OperationsHub({ warehouses, canCreateAdjustment }: OperationsHubProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeWarehouseId = searchParams.get("warehouseId") ?? "";
  const activeWarehouse = warehouses.find((warehouse) => warehouse.id === activeWarehouseId) ?? null;

  const queryWithoutWarehouse = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("warehouseId");
    return params;
  }, [searchParams]);

  const warehouseOptions = warehouses
    .slice()
    .sort((a, b) => `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`, "es"));

  const buildFlowHref = (card: OperationCard) => {
    if (!activeWarehouse) {
      return "#";
    }

    const params = new URLSearchParams();
    params.set("warehouseId", activeWarehouse.id);

    if (card.hrefPath) {
      return `${card.hrefPath}?${params.toString()}`;
    }

    params.set("mode", card.hrefMode);
    return `/operations/legacy?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Almacen activo</h3>
        <p className="mt-1 text-sm text-slate-600">Define el contexto para las operaciones de esta sesion.</p>

        <form action={pathname} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Seleccionar almacen</span>
            <select
              name="warehouseId"
              defaultValue={activeWarehouse?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Selecciona un almacen</option>
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} - {warehouse.name}
                </option>
              ))}
            </select>
          </label>

          {Array.from(queryWithoutWarehouse.entries()).map(([key, value]) => (
            <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
          ))}

          <button
            type="submit"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
          >
            Activar
          </button>

          <Link
            href="/operations"
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Limpiar
          </Link>
        </form>

        <p className="mt-3 text-sm text-slate-700">
          {activeWarehouse
            ? `Contexto activo: ${activeWarehouse.code} - ${activeWarehouse.name}`
            : "Sin contexto activo. Selecciona un almacen para habilitar tareas."}
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Flujos principales</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {MAIN_FLOW_CARDS.map((card) => (
            <Link
              key={card.hrefMode}
              href={buildFlowHref(card)}
              aria-disabled={!activeWarehouse}
              className={`rounded-xl border p-4 transition ${
                activeWarehouse
                  ? "border-slate-200 bg-white shadow-sm hover:border-brand-300 hover:shadow"
                  : "pointer-events-none border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{card.title}</p>
              <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Flujos operativos adicionales</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {SECONDARY_FLOW_CARDS.map((card) => (
            <Link
              key={card.hrefMode}
              href={buildFlowHref(card)}
              aria-disabled={!activeWarehouse}
              className={`rounded-xl border p-4 transition ${
                activeWarehouse
                  ? "border-slate-200 bg-white shadow-sm hover:border-brand-300 hover:shadow"
                  : "pointer-events-none border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{card.title}</p>
              <p className="mt-1 text-sm text-slate-600">{card.description}</p>
            </Link>
          ))}

          {canCreateAdjustment ? (
            <Link
              href={buildFlowHref({
                title: "Ajuste administrativo",
                description: "",
                hrefMode: "adjustment",
                hrefPath: "/operations/adjustment",
              })}
              aria-disabled={!activeWarehouse}
              className={`rounded-xl border p-4 transition ${
                activeWarehouse
                  ? "border-amber-200 bg-amber-50 shadow-sm hover:border-amber-300 hover:shadow"
                  : "pointer-events-none border-slate-200 bg-slate-50 opacity-70"
              }`}
            >
              <p className="text-sm font-semibold text-amber-900">Ajuste administrativo</p>
              <p className="mt-1 text-sm text-amber-800">Correccion controlada para conciliacion de inventario.</p>
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
