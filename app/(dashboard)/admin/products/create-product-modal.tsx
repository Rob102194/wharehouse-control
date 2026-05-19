"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProductWithVariantAction } from "@/app/(dashboard)/admin/products/actions";
import { Modal } from "@/app/(dashboard)/components/modal";

type FormState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
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
      {pending ? "Creando..." : "Crear mercancía"}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-600">{message}</p>;
}

export function CreateProductWithVariantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [state, formAction] = useActionState(createProductWithVariantAction, initialState);

  const handleSuccess = () => {
    if (state.ok) {
      setIsOpen(false);
      setStep(1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
      >
        + Nueva mercancía
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Crear mercancía">
        <form action={formAction} onSubmit={() => setTimeout(handleSuccess, 100)} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-700">Paso 1: Datos del producto</h3>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Nombre del producto</span>
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Ej: Atún, Arroz, Servilletas"
                />
                <FieldError message={state.errors?.name} />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Descripción (opcional)</span>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_measurable"
                  defaultChecked
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="font-medium text-slate-700">Producto medible (kg/lt)</span>
              </label>
              <p className="text-xs text-slate-500">
                Si está marcado, las variantes requerirán segunda unidad para calcular totales.
              </p>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
              >
                Siguiente
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h3 className="mb-3 text-sm font-medium text-slate-700">Paso 2: Primera variante</h3>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Nombre de variante</span>
                <input
                  name="variant_name"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder="Ej: Lata 150g, Botella 1L"
                />
                <FieldError message={state.errors?.variant_name} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Unidad principal</span>
                  <select
                    name="variant_unit_name"
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Selecciona</option>
                    <option value="kg">kg</option>
                    <option value="lt">lt</option>
                    <option value="racion">racion</option>
                    <option value="pomo">pomo</option>
                    <option value="lata">lata</option>
                    <option value="paquete">paquete</option>
                    <option value="bolsa">bolsa</option>
                    <option value="saco">saco</option>
                    <option value="botella">botella</option>
                    <option value="galon">galon</option>
                  </select>
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">SKU (opcional)</span>
                  <input
                    name="variant_sku"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Segunda unidad (kg/lt)</span>
                  <select
                    name="secondary_unit"
                    defaultValue=""
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Selecciona</option>
                    <option value="kg">kg</option>
                    <option value="lt">lt</option>
                  </select>
                  <FieldError message={state.errors?.secondary_unit} />
                </label>

                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Cantidad</span>
                  <input
                    type="number"
                    name="secondary_quantity"
                    step="0.001"
                    min="0.001"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <FieldError message={state.errors?.secondary_quantity} />
                </label>
              </div>

              <p className="text-xs text-slate-500">
                La segunda unidad es obligatoria para productos medibles. Ej: &quot;Lata&quot; con 0.15 kg.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Atrás
                </button>
                <SubmitButton />
              </div>
            </>
          )}

          {state.message && !state.ok && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}
        </form>
      </Modal>
    </>
  );
}