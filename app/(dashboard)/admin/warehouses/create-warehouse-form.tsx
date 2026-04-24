"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createWarehouseAction } from "@/app/(dashboard)/admin/warehouses/actions";

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
      {pending ? "Creando..." : "Crear almacen"}
    </button>
  );
}

export function CreateWarehouseForm() {
  const [state, formAction] = useActionState(createWarehouseAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Alta de almacen</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Codigo</span>
          <input
            name="code"
            required
            maxLength={20}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nombre</span>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
