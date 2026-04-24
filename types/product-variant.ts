export type ProductVariant = {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  sku: string | null;
  presentation: string | null;
  unit_name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
