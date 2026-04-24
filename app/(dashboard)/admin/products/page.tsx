import Link from "next/link";
import { CreateProductForm } from "@/app/(dashboard)/admin/products/create-product-form";
import { ProductsManagement } from "@/app/(dashboard)/admin/products/products-management";
import { requireRole } from "@/server/profile";
import { listProducts } from "@/server/products";

export default async function ProductsPage() {
  await requireRole(["admin"]);
  const products = await listProducts();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Productos base</h2>
          <p className="text-slate-600">Gestiona los productos conceptuales que luego se dividen en variantes operativas.</p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
          Volver a admin
        </Link>
      </div>

      <CreateProductForm />
      <ProductsManagement products={products} />
    </section>
  );
}
