import { notFound } from "next/navigation";
import { requireRole } from "@/server/profile";
import { getMovementWithItems } from "@/server/movements";
import { listWarehouses } from "@/server/warehouses";
import { MovementEditForm } from "./movement-edit-form";

type MovementEditPageProps = {
  params: Promise<{ movementId: string }>;
};

export default async function MovementEditPage({ params }: MovementEditPageProps) {
  const roleCheck = await requireRole(["admin", "operator"]);
  if (!roleCheck) {
    return <div>No autorizado</div>;
  }

  const { movementId } = await params;
  const [movement, warehouses] = await Promise.all([
    getMovementWithItems(movementId),
    listWarehouses(),
  ]);

  if (!movement) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Editar movimiento</h2>
        <p className="text-slate-600">
          Edita los campos del movimiento. La fecha de creación original se mantendrá para trazabilidad.
        </p>
      </div>

      <MovementEditForm
        movement={movement}
        warehouses={warehouses}
      />
    </section>
  );
}