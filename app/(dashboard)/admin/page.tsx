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
      <p className="text-slate-600">Gestion inicial de usuarios internos para el MVP.</p>
      <CreateUserForm />
      <UsersManagement users={users ?? []} currentAdminId={currentAdmin.id} />
    </section>
  );
}
