-- Ejecutar DESPUÉS de 01_schema.sql y 02_admin.sql (pegar completo y Run)
create function crear_perfil(p_id uuid, p_nombre text, p_permisos text[]) returns void
language plpgsql security definer set search_path = public as $$
declare x text;
begin
  if not es_admin() then raise exception 'Solo el administrador puede crear usuarios'; end if;
  insert into perfiles(id, nombre, rol) values (p_id, p_nombre, 'empleado');
  foreach x in array coalesce(p_permisos, '{}') loop insert into permisos_usuario values (p_id, x, true); end loop;
end $$;

create function sesion_abierta_si_efectivo(p_medio text) returns uuid language plpgsql security definer set search_path = public as $$
declare s uuid;
begin
  if p_medio <> 'efectivo' then return null; end if;
  select id into s from sesiones_caja where estado = 'abierta';
  if s is null then raise exception 'Para pagar en efectivo debe haber una caja abierta'; end if;
  return s;
end $$;

create function registrar_gasto(p_categoria uuid, p_desc text, p_monto numeric, p_medio text, p_obs text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not tiene_permiso('registrar_gastos') then raise exception 'Sin permiso para registrar gastos'; end if;
  insert into gastos(categoria_id, descripcion, monto, medio_pago, sesion_id, observaciones, usuario_id)
  values (p_categoria, p_desc, p_monto, p_medio, sesion_abierta_si_efectivo(p_medio), p_obs, auth.uid()) returning id into v;
  return v;
end $$;

-- items: [{producto_id|null, concepto, categoria_gasto_id, cantidad, costo}]
create function registrar_compra(p_proveedor uuid, p_medio text, p_items jsonb, p_obs text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid; it jsonb; pid uuid; q numeric; c numeric; tot numeric := 0; st integer;
begin
  if not tiene_permiso('registrar_compras') then raise exception 'Sin permiso para registrar compras'; end if;
  insert into compras(proveedor_id, medio_pago, sesion_id, observaciones, usuario_id)
  values (p_proveedor, p_medio, sesion_abierta_si_efectivo(p_medio), p_obs, auth.uid()) returning id into v;
  for it in select * from jsonb_array_elements(p_items) loop
    pid := nullif(it->>'producto_id','')::uuid; q := (it->>'cantidad')::numeric; c := (it->>'costo')::numeric;
    insert into compra_detalle(compra_id, producto_id, concepto, categoria_gasto_id, cantidad, costo_unitario, subtotal)
    values (v, pid, it->>'concepto', nullif(it->>'categoria_gasto_id','')::uuid, q, c, q * c);
    tot := tot + q * c;
    if pid is not null then
      select stock_actual into st from productos where id = pid;
      update productos set stock_actual = stock_actual + q::int where id = pid;
      insert into movimientos_inventario(producto_id,tipo,cantidad,stock_antes,stock_despues,origen_tabla,origen_id,usuario_id)
      values (pid,'compra',q::int,st,st + q::int,'compras',v,auth.uid());
    end if;
  end loop;
  update compras set total = tot where id = v;
  return v;
end $$;

create function generar_periodos(p_anio int, p_mes int) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not tiene_permiso('ver_sueldos') then raise exception 'Sin permiso'; end if;
  insert into sueldo_periodos(empleado_id, anio, mes, sueldo_acordado)
  select id, p_anio, p_mes, sueldo_mensual from empleados where activo on conflict do nothing;
  get diagnostics n = row_count; return n;
end $$;

create function pagar_sueldo(p_periodo uuid, p_tipo text, p_monto numeric, p_medio text)
returns uuid language plpgsql security definer set search_path = public as $$
declare per sueldo_periodos; pagado numeric; v uuid;
begin
  if not tiene_permiso('ver_sueldos') then raise exception 'Sin permiso para pagar sueldos'; end if;
  select * into per from sueldo_periodos where id = p_periodo for update;
  select coalesce(sum(monto),0) into pagado from pagos_sueldo where periodo_id = p_periodo and estado = 'valido';
  if p_monto > per.sueldo_acordado - pagado then
    raise exception 'El pago supera el saldo pendiente (Bs %)', per.sueldo_acordado - pagado;
  end if;
  insert into pagos_sueldo(periodo_id, tipo, monto, medio_pago, sesion_id, usuario_id)
  values (p_periodo, p_tipo, p_monto, p_medio, sesion_abierta_si_efectivo(p_medio), auth.uid()) returning id into v;
  return v;
end $$;

grant execute on function crear_perfil, registrar_gasto, registrar_compra, generar_periodos, pagar_sueldo to authenticated;
