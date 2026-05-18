import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Product } from "@/types/product";

export async function listProducts(): Promise<Product[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("products")
    .select("id, name, description, is_measurable, active, created_at, updated_at")
    .order("name", { ascending: true })
    .returns<Product[]>();

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getProductById(productId: string): Promise<Product | null> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("products")
    .select("id, name, description, is_measurable, active, created_at, updated_at")
    .eq("id", productId)
    .returns<Product[]>();

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}
