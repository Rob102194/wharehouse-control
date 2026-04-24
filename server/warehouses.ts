import { createSupabaseAdminClient } from "@/supabase/admin";
import type { Warehouse } from "@/types/warehouse";

export async function listWarehouses(): Promise<Warehouse[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("warehouses")
    .select("id, code, name, active, created_at, updated_at")
    .order("name", { ascending: true })
    .returns<Warehouse[]>();

  if (error || !data) {
    return [];
  }

  return data;
}

export async function listActiveWarehouses(): Promise<Warehouse[]> {
  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("warehouses")
    .select("id, code, name, active, created_at, updated_at")
    .eq("active", true)
    .order("name", { ascending: true })
    .returns<Warehouse[]>();

  if (error || !data) {
    return [];
  }

  return data;
}
