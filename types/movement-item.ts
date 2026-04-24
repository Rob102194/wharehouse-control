export type MovementItem = {
  id: string;
  movement_id: string;
  product_variant_id: string;
  quantity: number;
  received_quantity: number | null;
  created_at: string;
};

export type MovementRpcItemInput = {
  product_variant_id: string;
  quantity: number;
};

export type TransferReceiptItemInput = {
  product_variant_id: string;
  received_quantity: number;
};
