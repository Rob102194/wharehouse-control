import Link from "next/link";
import { CreateWarehouseForm } from "@/app/(dashboard)/admin/warehouses/create-warehouse-form";
import { WarehousesManagement } from "@/app/(dashboard)/admin/warehouses/warehouses-management";
import { requireRole } from "@/server/profile";
import { listWarehouses } from "@/server/warehouses";

export default async function WarehousesPage() {
  await requireRole(["admin"]);
  const warehouses = await listWarehouses();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Almacenes</h2>
          <p className="text-slate-600">Gestiona los almacenes operativos disponibles para entradas, salidas y transferencias.</p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
          Volver a admin
        </Link>
      </div>

      <CreateWarehouseForm />
      <WarehousesManagement warehouses={warehouses} />
    </section>
  );
}
