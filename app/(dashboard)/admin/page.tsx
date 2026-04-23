import { requireRole } from "@/server/profile";
import { CreateUserForm } from "@/app/(dashboard)/admin/create-user-form";

export default async function AdminPage() {
  await requireRole(["admin"]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Administracion</h2>
      <p className="text-slate-600">Gestion inicial de usuarios internos para el MVP.</p>
      <CreateUserForm />
    </section>
  );
}
