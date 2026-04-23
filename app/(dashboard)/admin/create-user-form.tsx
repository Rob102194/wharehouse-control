"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createInternalUserAction } from "@/app/(dashboard)/admin/actions";

type FormState = {
  ok: boolean;
  message: string;
};

const initialState: FormState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Creando..." : "Crear usuario"}
    </button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createInternalUserAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Alta de usuario interno</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Usuario</span>
          <input
            name="username"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Email interno</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Contrasena temporal</span>
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Rol</span>
          <select
            name="role"
            required
            defaultValue="operator"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Nombre completo (opcional)</span>
        <input
          name="full_name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked className="h-4 w-4 rounded border-slate-300" />
        Usuario activo
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
