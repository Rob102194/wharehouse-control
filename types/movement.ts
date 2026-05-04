import type { AdjustmentDirection, MovementStatus, MovementType } from "@/types/domain";

export type MovementHistoryFilters = {
  movementType?: MovementType;
  status?: MovementStatus;
  warehouseId?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type Movement = {
  id: string;
  movement_type: MovementType;
  status: MovementStatus;
  origin_warehouse_id: string | null;
  destination_warehouse_id: string | null;
  adjustment_direction: AdjustmentDirection | null;
  adjustment_reason: string | null;
  notes: string | null;
  incident_note: string | null;
  created_by: string;
  created_at: string;
  confirmed_at: string;
  received_by: string | null;
  received_at: string | null;
};

export type TransferInTransit = {
  id: string;
  origin_warehouse_id: string;
  origin_warehouse_name: string | null;
  destination_warehouse_id: string;
  destination_warehouse_name: string | null;
  created_at: string;
  notes: string | null;
};

export type TransferInTransitItem = {
  product_variant_id: string;
  product_variant_name: string;
  sku: string | null;
  quantity: number;
};

export type TransferInTransitWithItems = TransferInTransit & {
  items: TransferInTransitItem[];
};

export type MovementHistoryRow = {
  id: string;
  movement_type: MovementType;
  status: MovementStatus;
  origin_warehouse_name: string | null;
  destination_warehouse_name: string | null;
  actor_name: string;
  created_at: string;
  notes: string | null;
  incident_note: string | null;
  adjustment_reason: string | null;
  adjustment_direction: AdjustmentDirection | null;
};
