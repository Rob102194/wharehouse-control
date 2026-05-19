import { NextRequest, NextResponse } from "next/server";
import { getStockForVariants } from "@/server/stock";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const warehouseId = searchParams.get("warehouse");
  const variantsParam = searchParams.get("variants");

  if (!warehouseId || !variantsParam) {
    return NextResponse.json({}, { status: 400 });
  }

  const variantIds = variantsParam.split(",").filter(Boolean);
  const stockMap = await getStockForVariants(warehouseId, variantIds);

  const result: Record<string, number> = {};
  stockMap.forEach((value, key) => {
    result[key] = value;
  });

  return NextResponse.json(result);
}