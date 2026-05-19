import Link from "next/link";
import { CreateProductWithVariantModal } from "./create-product-modal";
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
        <div className="flex gap-2">
          <CreateProductWithVariantModal />
          <Link href="/admin" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
            Volver a admin
          </Link>
        </div>
      </div>

      <ProductsManagement products={products} />
    </section>
  );
}
