-- =====================================================
-- SALTEÑERÍA - ESQUEMA (pegar completo en Supabase > SQL Editor > Run)
-- =====================================================

create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null default 'empleado' check (rol in ('admin','empleado')),
  activo boolean not null default true,
  empleado_id uuid,
  creado_en timestamptz not null default now()
);
create table permisos_usuario (
  usuario_id uuid references perfiles(id) on delete cascade,
  permiso text not null,
  concedido boolean not null default true,
  primary key (usuario_id, permiso)
);
create table empleados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, cargo text, fecha_ingreso date,
  sueldo_mensual numeric(12,2) not null check (sueldo_mensual >= 0),
  contacto text, activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create table categorias_producto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique, activa boolean not null default true
);
create table productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria_id uuid references categorias_producto(id),
  codigo text, precio_venta numeric(12,2) not null check (precio_venta >= 0),
  unidad text not null default 'unidad',
  controla_stock boolean not null default false,
  stock_actual integer not null default 0,
  stock_minimo integer not null default 0,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);
create table proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, telefono text, notas text,
  activo boolean not null default true
);
create table sesiones_caja (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  abierta_por uuid references perfiles(id),
  apertura_efectivo numeric(12,2) not null check (apertura_efectivo >= 0),
  estado text not null default 'abierta' check (estado in ('abierta','cerrada')),
  cerrada_por uuid references perfiles(id),
  efectivo_esperado numeric(12,2), efectivo_contado numeric(12,2), diferencia numeric(12,2),
  observaciones text,
  abierta_en timestamptz not null default now(), cerrada_en timestamptz
);
create unique index una_caja_abierta on sesiones_caja ((estado)) where estado = 'abierta';
create table movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references sesiones_caja(id),
  tipo text not null check (tipo in ('aporte','retiro','ajuste')),
  monto numeric(12,2) not null check (monto > 0),
  motivo text not null, usuario_id uuid references perfiles(id),
  creado_en timestamptz not null default now()
);
create table ventas (
  id uuid primary key default gen_random_uuid(),
  id_cliente uuid not null unique,
  sesion_id uuid not null references sesiones_caja(id),
  medio_pago text not null check (medio_pago in ('efectivo','qr')),
  total numeric(12,2) not null default 0,
  estado text not null default 'valida' check (estado in ('valida','anulada')),
  anulada_por uuid references perfiles(id), motivo_anulacion text,
  usuario_id uuid references perfiles(id),
  fecha_dispositivo timestamptz, creado_en timestamptz not null default now()
);
create table venta_detalle (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references ventas(id),
  producto_id uuid not null references productos(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null,
  subtotal numeric(12,2) not null
);
create table movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id),
  tipo text not null check (tipo in ('compra','venta','ajuste','merma','consumo_interno','anulacion')),
  cantidad integer not null, stock_antes integer, stock_despues integer,
  motivo text, origen_tabla text, origen_id uuid,
  usuario_id uuid references perfiles(id),
  creado_en timestamptz not null default now()
);
create table categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique, activa boolean not null default true
);
create table compras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default ((now() at time zone 'America/La_Paz')::date),
  proveedor_id uuid references proveedores(id),
  medio_pago text not null check (medio_pago in ('efectivo','qr','transferencia')),
  total numeric(12,2) not null default 0,
  sesion_id uuid references sesiones_caja(id),
  estado text not null default 'valida' check (estado in ('valida','anulada')),
  observaciones text, usuario_id uuid references perfiles(id),
  creado_en timestamptz not null default now()
);
create table compra_detalle (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references compras(id),
  producto_id uuid references productos(id),
  concepto text, categoria_gasto_id uuid references categorias_gasto(id),
  cantidad numeric(12,2) not null check (cantidad > 0),
  costo_unitario numeric(12,2) not null check (costo_unitario >= 0),
  subtotal numeric(12,2) not null
);
create table gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default ((now() at time zone 'America/La_Paz')::date),
  categoria_id uuid references categorias_gasto(id),
  descripcion text not null, monto numeric(12,2) not null check (monto > 0),
  medio_pago text not null check (medio_pago in ('efectivo','qr','transferencia')),
  sesion_id uuid references sesiones_caja(id),
  estado text not null default 'valido' check (estado in ('valido','anulado')),
  observaciones text, usuario_id uuid references perfiles(id),
  creado_en timestamptz not null default now()
);
create table cierres_manuales (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','confirmado','anulado')),
  efectivo_declarado numeric(12,2) not null default 0,
  qr_declarado numeric(12,2) not null default 0,
  total_calculado numeric(12,2) not null default 0, diferencia numeric(12,2),
  confirmado_por uuid references perfiles(id), observaciones text,
  usuario_id uuid references perfiles(id), creado_en timestamptz not null default now()
);
create unique index un_cierre_vigente on cierres_manuales (fecha) where estado <> 'anulado';
create table cierre_manual_detalle (
  id uuid primary key default gen_random_uuid(),
  cierre_id uuid not null references cierres_manuales(id),
  producto_id uuid not null references productos(id),
  cantidad integer not null check (cantidad >= 0),
  precio_unitario numeric(12,2) not null
);
create table sueldo_periodos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references empleados(id),
  anio integer not null, mes integer not null check (mes between 1 and 12),
  sueldo_acordado numeric(12,2) not null check (sueldo_acordado >= 0),
  unique (empleado_id, anio, mes)
);
create table pagos_sueldo (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid not null references sueldo_periodos(id),
  tipo text not null check (tipo in ('anticipo','parcial','completo')),
  monto numeric(12,2) not null check (monto > 0),
  medio_pago text not null check (medio_pago in ('efectivo','qr','transferencia')),
  sesion_id uuid references sesiones_caja(id),
  estado text not null default 'valido' check (estado in ('valido','anulado')),
  usuario_id uuid references perfiles(id), creado_en timestamptz not null default now()
);
create table configuracion (clave text primary key, valor text not null);
create table auditoria (
  id bigserial primary key,
  usuario_id uuid, accion text, tabla text, registro_id text,
  antes jsonb, despues jsonb, creado_en timestamptz not null default now()
);

insert into categorias_producto(nombre) values ('Salteñas'),('Bebidas'),('Otros');
insert into categorias_gasto(nombre) values ('Alquiler'),('Servicios básicos'),('Transporte'),('Limpieza'),('Reparaciones'),('Materiales'),('Insumos'),('Otros');
insert into configuracion values ('nombre_negocio','Mi Salteñería'),('tolerancia_caja','5');

-- ---------- Ayudantes de seguridad ----------
create function es_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from perfiles where id = auth.uid() and rol = 'admin' and activo) $$;

create function tiene_permiso(p text) returns boolean language sql stable security definer set search_path = public as
$$ select es_admin() or exists(select 1 from permisos_usuario u join perfiles f on f.id = u.usuario_id
   where u.usuario_id = auth.uid() and u.permiso = p and u.concedido and f.activo) $$;

-- ---------- RLS: todas las tablas ----------
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
    if t <> 'auditoria' then
      execute format('create policy admin_leer on %I for select using (es_admin())', t);
      execute format('create policy admin_crear on %I for insert with check (es_admin())', t);
      execute format('create policy admin_editar on %I for update using (es_admin())', t);
    end if;
  end loop;
end $$;
create policy aud_admin on auditoria for select using (es_admin());   -- solo lectura; nadie edita ni borra

-- Lo que puede leer un empleado (nunca escribe directo: usa las funciones de abajo)
create policy emp_perfil on perfiles for select using (id = auth.uid());
create policy emp_permisos on permisos_usuario for select using (usuario_id = auth.uid());
create policy emp_productos on productos for select using (auth.uid() is not null);
create policy emp_categorias on categorias_producto for select using (auth.uid() is not null);
create policy emp_config on configuracion for select using (auth.uid() is not null);
create policy emp_caja on sesiones_caja for select using (tiene_permiso('caja'));
create policy emp_ventas on ventas for select using (usuario_id = auth.uid() or tiene_permiso('ver_historial_completo'));
create policy emp_venta_det on venta_detalle for select using
  (exists(select 1 from ventas v where v.id = venta_id and (v.usuario_id = auth.uid() or tiene_permiso('ver_historial_completo'))));
create policy emp_inv on productos for update using (false);
create policy emp_sueldos_p on sueldo_periodos for select using (tiene_permiso('ver_sueldos'));
create policy emp_sueldos_g on pagos_sueldo for select using (tiene_permiso('ver_sueldos'));
create policy emp_gastos on gastos for select using (tiene_permiso('registrar_gastos'));
create policy emp_compras on compras for select using (tiene_permiso('registrar_compras'));
create policy emp_mov_inv on movimientos_inventario for select using (tiene_permiso('ver_inventario'));

-- ---------- Auditoría automática ----------
create function auditar() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria(usuario_id, accion, tabla, registro_id, antes, despues)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')),
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['perfiles','permisos_usuario','productos','sesiones_caja','movimientos_caja','ventas',
    'compras','gastos','pagos_sueldo','cierres_manuales','movimientos_inventario','empleados'] loop
    execute format('create trigger aud_%1$s after insert or update or delete on %1$I for each row execute function auditar()', t);
  end loop;
end $$;

-- ---------- Funciones de caja ----------
create function abrir_caja(p_apertura numeric) returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not tiene_permiso('caja') then raise exception 'Sin permiso para abrir caja'; end if;
  insert into sesiones_caja(fecha, abierta_por, apertura_efectivo)
  values ((now() at time zone 'America/La_Paz')::date, auth.uid(), p_apertura) returning id into v;
  return v;
exception when unique_violation then raise exception 'Ya existe una caja abierta o cerrada para hoy';
end $$;

create function efectivo_esperado(p_sesion uuid) returns numeric language sql stable security definer set search_path = public as $$
  select s.apertura_efectivo
   + coalesce((select sum(total) from ventas where sesion_id = s.id and estado='valida' and medio_pago='efectivo'),0)
   + coalesce((select sum(monto) from movimientos_caja where sesion_id = s.id and tipo='aporte'),0)
   - coalesce((select sum(monto) from movimientos_caja where sesion_id = s.id and tipo='retiro'),0)
   - coalesce((select sum(monto) from gastos where sesion_id = s.id and estado='valido' and medio_pago='efectivo'),0)
   - coalesce((select sum(total) from compras where sesion_id = s.id and estado='valida' and medio_pago='efectivo'),0)
   - coalesce((select sum(monto) from pagos_sueldo where sesion_id = s.id and estado='valido' and medio_pago='efectivo'),0)
  from sesiones_caja s where s.id = p_sesion $$;

create function cerrar_caja(p_contado numeric, p_obs text default null) returns numeric language plpgsql security definer set search_path = public as $$
declare s sesiones_caja; esp numeric; dif numeric; tol numeric;
begin
  if not tiene_permiso('caja') then raise exception 'Sin permiso para cerrar caja'; end if;
  select * into s from sesiones_caja where estado = 'abierta';
  if not found then raise exception 'No hay caja abierta'; end if;
  esp := efectivo_esperado(s.id); dif := p_contado - esp;
  select valor::numeric into tol from configuracion where clave = 'tolerancia_caja';
  if abs(dif) > coalesce(tol,5) and coalesce(trim(p_obs),'') = '' then
    raise exception 'La diferencia es de Bs %. Escribe una observación para cerrar.', dif;
  end if;
  update sesiones_caja set estado='cerrada', cerrada_por=auth.uid(), efectivo_esperado=esp,
    efectivo_contado=p_contado, diferencia=dif, observaciones=p_obs, cerrada_en=now() where id = s.id;
  return dif;
end $$;

-- ---------- Registrar venta (idempotente: sirve para sincronizar sin internet) ----------
create function registrar_venta(p_id uuid, p_medio text, p_items jsonb, p_fecha timestamptz default now())
returns uuid language plpgsql security definer set search_path = public as $$
declare s uuid; v uuid; it jsonb; pr productos; c integer; tot numeric := 0;
begin
  if not tiene_permiso('vender') then raise exception 'Sin permiso para vender'; end if;
  select id into v from ventas where id_cliente = p_id;
  if found then return v; end if;                              -- ya sincronizada, no duplica
  select id into s from sesiones_caja where estado = 'abierta';
  if s is null then raise exception 'No hay caja abierta'; end if;
  insert into ventas(id_cliente, sesion_id, medio_pago, usuario_id, fecha_dispositivo)
  values (p_id, s, p_medio, auth.uid(), p_fecha) returning id into v;
  for it in select * from jsonb_array_elements(p_items) loop
    c := (it->>'cantidad')::int;
    select * into pr from productos where id = (it->>'producto_id')::uuid and activo;
    if not found or c <= 0 then raise exception 'Producto o cantidad no válidos'; end if;
    insert into venta_detalle(venta_id, producto_id, cantidad, precio_unitario, subtotal)
    values (v, pr.id, c, pr.precio_venta, pr.precio_venta * c);
    tot := tot + pr.precio_venta * c;
    if pr.controla_stock then                                  -- stock negativo permitido (regla 1)
      update productos set stock_actual = stock_actual - c where id = pr.id;
      insert into movimientos_inventario(producto_id,tipo,cantidad,stock_antes,stock_despues,origen_tabla,origen_id,usuario_id)
      values (pr.id,'venta',-c,pr.stock_actual,pr.stock_actual - c,'ventas',v,auth.uid());
    end if;
  end loop;
  update ventas set total = tot where id = v;
  return v;
end $$;

create function anular_venta(p_id uuid, p_motivo text) returns void language plpgsql security definer set search_path = public as $$
declare vt ventas; d record; st integer;
begin
  if not tiene_permiso('anular_ventas') then raise exception 'Sin permiso para anular'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo es obligatorio'; end if;
  select * into vt from ventas where id = p_id and estado = 'valida';
  if not found then raise exception 'Venta no encontrada o ya anulada'; end if;
  update ventas set estado='anulada', anulada_por=auth.uid(), motivo_anulacion=p_motivo where id = p_id;
  for d in select vd.producto_id, vd.cantidad from venta_detalle vd join productos p on p.id = vd.producto_id
           where vd.venta_id = p_id and p.controla_stock loop
    select stock_actual into st from productos where id = d.producto_id;
    update productos set stock_actual = stock_actual + d.cantidad where id = d.producto_id;
    insert into movimientos_inventario(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,origen_tabla,origen_id,usuario_id)
    values (d.producto_id,'anulacion',d.cantidad,st,st + d.cantidad,p_motivo,'ventas',p_id,auth.uid());
  end loop;
end $$;

grant execute on function abrir_caja, cerrar_caja, registrar_venta, anular_venta, efectivo_esperado to authenticated;
