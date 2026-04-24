"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProductVariantAction } from "@/app/(dashboard)/admin/product-variants/actions";
import type { Product } from "@/types/product";

type CreateProductVariantFormProps = {
  products: Product[];
};

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
      {pending ? "Creando..." : "Crear variante"}
    </button>
  );
}

export function CreateProductVariantForm({ products }: CreateProductVariantFormProps) {
  const [state, formAction] = useActionState(createProductVariantAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Alta de variante operativa</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Producto base</span>
          <select
            name="product_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="" disabled>
              Selecciona un producto base
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Nombre de variante</span>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">SKU (opcional)</span>
          <input
            name="sku"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Presentacion (opcional)</span>
          <input
            name="presentation"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-slate-700">Unidad (opcional)</span>
        <input
          name="unit_name"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
