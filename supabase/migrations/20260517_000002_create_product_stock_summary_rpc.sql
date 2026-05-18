-- RPC for product stock consolidation by secondary unit
-- Returns variants and total stock aggregated by secondary unit (kg/lt)

create or replace function public.get_product_stock_summary(
  p_warehouse_id uuid default null
)
returns table(
  product_id uuid,
  product_name text,
  is_measurable boolean,
  variants jsonb,
  total_by_secondary_unit jsonb
)
language plpgsql
stable
as $$
begin
  return query
  select 
    p.id as product_id,
    p.name as product_name,
    p.is_measurable,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'variant_id', pv.id,
            'variant_name', pv.name,
            'unit_name', pv.unit_name,
            'secondary_unit', pv.secondary_unit,
            'secondary_quantity', pv.secondary_quantity,
            'stock', coalesce(ws.stock, 0)
          ) order by pv.name
        )
        from product_variants pv
        left join warehouse_stock ws on ws.product_variant_id = pv.id
          and (p_warehouse_id is null or ws.warehouse_id = p_warehouse_id)
        where pv.product_id = p.id and pv.active = true
      ),
      '[]'::jsonb
    ) as variants,
    (
      select coalesce(jsonb_object_agg(secondary_unit, total), '{}'::jsonb)
      from (
        select 
          pv.secondary_unit,
          sum(coalesce(ws.stock, 0) * pv.secondary_quantity) as total
        from product_variants pv
        left join warehouse_stock ws on ws.product_variant_id = pv.id
          and (p_warehouse_id is null or ws.warehouse_id = p_warehouse_id)
        where pv.product_id = p.id
          and pv.active = true
          and pv.secondary_unit is not null
          and pv.secondary_quantity is not null
        group by pv.secondary_unit
      ) sub
    ) as total_by_secondary_unit
  from products p
  where exists (
    select 1 from product_variants pv 
    where pv.product_id = p.id and pv.active = true
  )
  order by p.name;
end;
$$;
$$;