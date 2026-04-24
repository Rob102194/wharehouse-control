import type { AdjustmentDirection, MovementStatus, MovementType } from "@/types/domain";

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
  destination_warehouse_id: string;
  created_at: string;
  notes: string | null;
};
