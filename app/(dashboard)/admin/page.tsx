import Link from "next/link";
import { requireRole } from "@/server/profile";
import { CreateUserForm } from "@/app/(dashboard)/admin/create-user-form";
import { UsersManagement } from "@/app/(dashboard)/admin/users-management";
import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Role } from "@/types/domain";

export default async function AdminPage() {
  const currentAdmin = await requireRole(["admin"]);
  const adminClient = createSupabaseAdminClient();
  const { data: users } = await adminClient
    .from("profiles")
    .select("id, username, email, full_name, role, active, created_at")
    .order("created_at", { ascending: false })
    .returns<
      Array<{
        id: string;
        username: string;
        email: string | null;
        full_name: string | null;
        role: Role;
        active: boolean;
        created_at: string;
      }>
    >();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Administracion</h2>
      <p className="text-slate-600">Centro de gestion administrativa para usuarios y catalogos del MVP.</p>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/warehouses"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/30"
        >
          <p className="text-base font-semibold text-slate-900">Almacenes</p>
          <p className="mt-1 text-sm text-slate-600">Configura los almacenes fisicos usados en operaciones y transferencias.</p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/30"
        >
          <p className="text-base font-semibold text-slate-900">Productos base</p>
          <p className="mt-1 text-sm text-slate-600">Gestiona los productos conceptuales que serviran como base para variantes operativas.</p>
        </Link>
        <Link
          href="/admin/product-variants"
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/30"
        >
          <p className="text-base font-semibold text-slate-900">Variantes operativas</p>
          <p className="mt-1 text-sm text-slate-600">Configura las presentaciones reales que se mueven en inventario.</p>
        </Link>
      </section>

      <CreateUserForm />
      <UsersManagement users={users ?? []} currentAdminId={currentAdmin.id} />
    </section>
  );
}
