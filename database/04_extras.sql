-- Ejecutar DESPUÉS de 03_funciones.sql (pegar completo y Run)
create policy emp_prov on proveedores for select using (tiene_permiso('registrar_compras'));
create policy emp_catg on categorias_gasto for select using (auth.uid() is not null);
create policy emp_empl on empleados for select using (tiene_permiso('ver_sueldos'));
create policy emp_movcaja on movimientos_caja for select using (tiene_permiso('caja'));
create policy emp_cdet on compra_detalle for select using (tiene_permiso('registrar_compras'));

create function mover_caja(p_tipo text, p_monto numeric, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare s uuid;
begin
  if not tiene_permiso('caja') then raise exception 'Sin permiso'; end if;
  select id into s from sesiones_caja where estado = 'abierta';
  if s is null then raise exception 'No hay caja abierta'; end if;
  insert into movimientos_caja(sesion_id, tipo, monto, motivo, usuario_id) values (s, p_tipo, p_monto, p_motivo, auth.uid());
end $$;

-- p_cantidad con signo (+ suma, - resta). tipo: ajuste | merma | consumo_interno
create function ajustar_stock(p_producto uuid, p_cantidad int, p_tipo text, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare st int;
begin
  if not tiene_permiso('ajustar_inventario') then raise exception 'Sin permiso para ajustar inventario'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo es obligatorio'; end if;
  select stock_actual into st from productos where id = p_producto and controla_stock;
  if not found then raise exception 'Este producto no controla stock'; end if;
  update productos set stock_actual = st + p_cantidad where id = p_producto;
  insert into movimientos_inventario(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,usuario_id)
  values (p_producto,p_tipo,p_cantidad,st,st + p_cantidad,p_motivo,auth.uid());
end $$;
grant execute on function mover_caja, ajustar_stock to authenticated;
