export type ProductVariant = {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  sku: string | null;
  presentation: string | null;
  unit_name: string | null;
  secondary_unit: string | null;
  secondary_quantity: number | null;
  product_is_measurable: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SecondaryUnit = "kg" | "lt";
export type PrimaryUnit = "kg" | "lt" | "racion" | "pomo" | "lata" | "paquete";
