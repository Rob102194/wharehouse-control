import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">MVP Inventario</p>
        <h1 className="text-3xl font-semibold text-slate-900">Control de movimientos por almacen</h1>
        <p className="mt-3 text-slate-600">
          Base tecnica inicial lista para continuar con autenticacion, roles, catalogos y flujo de movimientos.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/operations"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-900"
          >
            Ir a operaciones
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ir a administracion
          </Link>
        </div>
      </div>
    </div>
  );
}
