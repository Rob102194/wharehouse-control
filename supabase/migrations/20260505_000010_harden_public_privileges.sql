revoke all on table public.products from anon, authenticated;
revoke all on table public.warehouses from anon, authenticated;
revoke all on table public.product_variants from anon, authenticated;
revoke all on table public.movements from anon, authenticated;
revoke all on table public.movement_items from anon, authenticated;

revoke all on table public.warehouse_stock from anon, authenticated;

grant select on table public.products to authenticated;
grant select on table public.warehouses to authenticated;
grant select on table public.product_variants to authenticated;
grant select on table public.movements to authenticated;
grant select on table public.movement_items to authenticated;

revoke execute on function public.create_entry(uuid, uuid, jsonb, text) from anon, authenticated;
revoke execute on function public.create_exit(uuid, uuid, jsonb, text) from anon, authenticated;
revoke execute on function public.create_transfer(uuid, uuid, uuid, jsonb, text) from anon, authenticated;
revoke execute on function public.receive_transfer(uuid, uuid, jsonb, text) from anon, authenticated;
revoke execute on function public.create_adjustment(uuid, uuid, text, text, jsonb, text) from anon, authenticated;
revoke execute on function public.parse_movement_items(jsonb) from anon, authenticated;
revoke execute on function public.parse_received_items(jsonb) from anon, authenticated;
revoke execute on function public.get_warehouse_variant_stock(uuid, uuid) from anon, authenticated;
