import { createSupabaseAdminClient } from "@/supabase/admin";
import type { ProductVariant } from "@/types/product-variant";

type ProductVariantRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  presentation: string | null;
  unit_name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  products: {
    name: string;
  } | null;
};

export async function listProductVariants(): Promise<ProductVariant[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("product_variants")
    .select("id, product_id, name, sku, presentation, unit_name, active, created_at, updated_at, products(name)")
    .order("created_at", { ascending: false })
    .returns<ProductVariantRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((variant) => ({
    id: variant.id,
    product_id: variant.product_id,
    product_name: variant.products?.name ?? "Producto sin nombre",
    name: variant.name,
    sku: variant.sku,
    presentation: variant.presentation,
    unit_name: variant.unit_name,
    active: variant.active,
    created_at: variant.created_at,
    updated_at: variant.updated_at,
  }));
}

export async function listActiveProductVariants(): Promise<ProductVariant[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("product_variants")
    .select("id, product_id, name, sku, presentation, unit_name, active, created_at, updated_at, products(name)")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .returns<ProductVariantRow[]>();

  if (error || !data) {
    return [];
  }

  return data.map((variant) => ({
    id: variant.id,
    product_id: variant.product_id,
    product_name: variant.products?.name ?? "Producto sin nombre",
    name: variant.name,
    sku: variant.sku,
    presentation: variant.presentation,
    unit_name: variant.unit_name,
    active: variant.active,
    created_at: variant.created_at,
    updated_at: variant.updated_at,
  }));
}
