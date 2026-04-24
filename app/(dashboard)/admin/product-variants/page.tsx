import Link from "next/link";
import { CreateProductVariantForm } from "@/app/(dashboard)/admin/product-variants/create-product-variant-form";
import { ProductVariantsManagement } from "@/app/(dashboard)/admin/product-variants/product-variants-management";
import { requireRole } from "@/server/profile";
import { listProductVariants } from "@/server/product-variants";
import { listProducts } from "@/server/products";

export default async function ProductVariantsPage() {
  await requireRole(["admin"]);
  const [products, variants] = await Promise.all([listProducts(), listProductVariants()]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Variantes operativas</h2>
          <p className="text-slate-600">Define las presentaciones reales que se moveran en entradas, salidas y transferencias.</p>
        </div>
        <Link href="/admin" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100">
          Volver a admin
        </Link>
      </div>

      <CreateProductVariantForm products={products} />
      <ProductVariantsManagement variants={variants} />
    </section>
  );
}
