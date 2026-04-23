"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateInternalUserAction } from "@/app/(dashboard)/admin/actions";
import type { Role } from "@/types/domain";

type AdminUserRow = {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  active: boolean;
  created_at: string;
};

type UsersManagementProps = {
  users: AdminUserRow[];
  currentAdminId: string;
};

type UpdateState = {
  ok: boolean;
  message: string;
};

const initialState: UpdateState = {
  ok: false,
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

function UserRow({ user, currentAdminId }: { user: AdminUserRow; currentAdminId: string }) {
  const [state, formAction] = useActionState(updateInternalUserAction, initialState);
  const isCurrentAdmin = user.id === currentAdminId;

  return (
    <tr className="border-t border-slate-200">
      <td className="px-3 py-3 align-top text-sm text-slate-800">
        <p className="font-medium">{user.username}</p>
        <p className="text-xs text-slate-500">{user.full_name ?? "Sin nombre"}</p>
      </td>
      <td className="px-3 py-3 align-top text-sm text-slate-700">{user.email ?? "Sin email"}</td>
      <td className="px-3 py-3 align-top">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="user_id" value={user.id} />
          <select
            name="role"
            defaultValue={user.role}
            disabled={isCurrentAdmin}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
          >
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>

          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={user.active}
              disabled={isCurrentAdmin}
              className="h-4 w-4 rounded border-slate-300"
            />
            Activo
          </label>

          <div className="flex items-center gap-2">
            <SaveButton />
            {state.message ? (
              <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</span>
            ) : null}
          </div>

          {isCurrentAdmin ? (
            <p className="text-xs text-slate-500">Tu usuario no puede desactivarse ni perder rol admin desde esta vista.</p>
          ) : null}
        </form>
      </td>
      <td className="px-3 py-3 align-top text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString("es-ES")}</td>
    </tr>
  );
}

export function UsersManagement({ users, currentAdminId }: UsersManagementProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Usuarios internos</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Usuario</th>
              <th className="px-3 py-2 font-medium">Email interno</th>
              <th className="px-3 py-2 font-medium">Gestion</th>
              <th className="px-3 py-2 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.id} user={user} currentAdminId={currentAdminId} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
