import Link from "next/link";
import { TransferReceiveForm } from "@/app/(dashboard)/operations/transfer-receive/transfer-receive-form";
import { listTransfersInTransitWithItems } from "@/server/movements";
import { requireRole } from "@/server/profile";
import { listActiveWarehouses } from "@/server/warehouses";

type TransferReceivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransferReceivePage({ searchParams }: TransferReceivePageProps) {
  await requireRole(["admin", "operator"]);

  const params = await searchParams;
  const selectedWarehouseId = typeof params.warehouseId === "string" ? params.warehouseId : "";
  const selectedTransferId = typeof params.transferId === "string" ? params.transferId : "";

  const [warehouses, inTransitTransfers] = await Promise.all([listActiveWarehouses(), listTransfersInTransitWithItems()]);
  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;

  const pendingForWarehouse = selectedWarehouse
    ? inTransitTransfers.filter((transfer) => transfer.destination_warehouse_id === selectedWarehouse.id)
    : [];

  const selectedTransfer = pendingForWarehouse.find((transfer) => transfer.id === selectedTransferId) ?? pendingForWarehouse[0] ?? null;
  const selectedTransferIndex = selectedTransfer
    ? pendingForWarehouse.findIndex((transfer) => transfer.id === selectedTransfer.id)
    : -1;
  const nextTransferId =
    selectedTransferIndex >= 0 && selectedTransferIndex + 1 < pendingForWarehouse.length
      ? pendingForWarehouse[selectedTransferIndex + 1].id
      : null;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Recibir transferencia</h2>
          <p className="text-slate-600">Confirma transferencias en transito dirigidas al almacen activo.</p>
        </div>
        <Link
          href={selectedWarehouseId ? `/operations?warehouseId=${encodeURIComponent(selectedWarehouseId)}` : "/operations"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          Volver al hub
        </Link>
      </div>

      {selectedWarehouse ? (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Pendientes</h3>
            {pendingForWarehouse.length === 0 ? (
              <p className="text-sm text-slate-600">No hay transferencias en transito para este almacen.</p>
            ) : (
              <ul className="space-y-2">
                {pendingForWarehouse.map((transfer) => {
                  const href = `/operations/transfer-receive?warehouseId=${encodeURIComponent(selectedWarehouse.id)}&transferId=${encodeURIComponent(transfer.id)}`;
                  const isSelected = selectedTransfer?.id === transfer.id;

                  return (
                    <li key={transfer.id}>
                      <Link
                        href={href}
                        className={`block rounded-lg border px-3 py-2 text-sm transition ${
                          isSelected
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="font-medium">{transfer.id}</p>
                        <p className="text-xs">Desde: {transfer.origin_warehouse_name ?? transfer.origin_warehouse_id}</p>
                        <p className="text-xs">{new Date(transfer.created_at).toLocaleString("es-ES")}</p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {selectedTransfer ? (
            <TransferReceiveForm
              warehouse={selectedWarehouse}
              transfer={selectedTransfer}
              warehouseId={selectedWarehouse.id}
              nextTransferId={nextTransferId}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              Selecciona una transferencia pendiente para ver el detalle y confirmar la recepcion.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No hay un almacen activo valido. Regresa al hub y selecciona un almacen para continuar.
        </div>
      )}
    </section>
  );
}
