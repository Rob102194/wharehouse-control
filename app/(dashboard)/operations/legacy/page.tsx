import { redirect } from "next/navigation";
import { requireRole } from "@/server/profile";

type LegacyOperationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MODE_TO_ROUTE: Record<string, string> = {
  "receive-purchase": "/operations/receive-purchase",
  "dispatch-restaurant": "/operations/dispatch-restaurant",
  "transfer-out": "/operations/transfer-out",
  "transfer-receive": "/operations/transfer-receive",
  "return-from-restaurant": "/operations/return-from-restaurant",
  "dispatch-production": "/operations/dispatch-production",
  "receive-from-production": "/operations/receive-from-production",
  adjustment: "/operations/adjustment",
};

export default async function LegacyOperationsPage({ searchParams }: LegacyOperationsPageProps) {
  await requireRole(["admin", "operator"]);
  const params = await searchParams;
  const mode = typeof params.mode === "string" ? params.mode : "";
  const warehouseId = typeof params.warehouseId === "string" ? params.warehouseId : "";
  const transferId = typeof params.transferId === "string" ? params.transferId : "";
  const targetRoute = MODE_TO_ROUTE[mode];

  if (!targetRoute) {
    const hubParams = new URLSearchParams();
    if (warehouseId) {
      hubParams.set("warehouseId", warehouseId);
    }

    redirect(hubParams.size > 0 ? `/operations?${hubParams.toString()}` : "/operations");
  }

  const targetParams = new URLSearchParams();
  if (warehouseId) {
    targetParams.set("warehouseId", warehouseId);
  }

  if (transferId && mode === "transfer-receive") {
    targetParams.set("transferId", transferId);
  }

  redirect(targetParams.size > 0 ? `${targetRoute}?${targetParams.toString()}` : targetRoute);
}
