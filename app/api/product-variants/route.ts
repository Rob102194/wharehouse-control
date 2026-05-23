import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/supabase/admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");

  const adminClient = createSupabaseAdminClient();

  let query = adminClient
    .from("product_variants")
    .select("id, name, sku, active")
    .eq("active", true)
    .order("name")
    .limit(20);

  if (search && search.trim().length >= 2) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data: variants, error } = await query;

  if (error) {
    return NextResponse.json({ variants: [] }, { status: 500 });
  }

  return NextResponse.json({ variants: variants ?? [] });
}