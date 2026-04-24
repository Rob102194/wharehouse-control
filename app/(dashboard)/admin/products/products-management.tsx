"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProductStatusAction } from "@/app/(dashboard)/admin/products/actions";
import type { Product } from "@/types/product";

type ProductsManagementProps = {
  products: Product[];
};

type ActionState = {
  ok: boolean;
  message: string;
};

const initialState: ActionState = {
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

function ProductRow({ product }: { product: Product }) {
  const [state, formAction] = useActionState(updateProductStatusAction, initialState);

  return (
    <tr className="border-t border-slate-200">
      <td className="px-3 py-3 align-top text-sm font-medium text-slate-900">{product.name}</td>
      <td className="px-3 py-3 align-top text-sm text-slate-700">{product.description ?? "-"}</td>
      <td className="px-3 py-3 align-top text-sm">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            product.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {product.active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td className="px-3 py-3 align-top text-xs text-slate-500">{new Date(product.created_at).toLocaleDateString("es-ES")}</td>
      <td className="px-3 py-3 align-top">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="product_id" value={product.id} />
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" name="active" defaultChecked={product.active} className="h-4 w-4 rounded border-slate-300" />
            Activo
          </label>
          <div className="flex items-center gap-2">
            <SaveButton />
            {state.message ? (
              <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</span>
            ) : null}
          </div>
        </form>
      </td>
    </tr>
  );
}

export function ProductsManagement({ products }: ProductsManagementProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Productos base</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Descripcion</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Creado</th>
              <th className="px-3 py-2 font-medium">Gestion</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
