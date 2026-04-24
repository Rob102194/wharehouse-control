import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Product } from "@/types/product";

export async function listProducts(): Promise<Product[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("products")
    .select("id, name, description, active, created_at, updated_at")
    .order("name", { ascending: true })
    .returns<Product[]>();

  if (error || !data) {
    return [];
  }

  return data;
}
