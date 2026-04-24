export type WarehouseStock = {
  warehouse_id: string;
  warehouse_name: string;
  product_variant_id: string;
  product_variant_name: string;
  sku: string | null;
  stock: number;
};
