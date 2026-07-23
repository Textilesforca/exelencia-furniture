-- Ejecuta esto en el SQL Editor de tu proyecto de Supabase
-- (Project > SQL Editor > New query)

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null,
  material text,
  ancho integer,      -- cm
  alto integer,       -- cm
  profundidad integer,-- cm
  precio_desde numeric,
  imagen text,
  descripcion text,
  creado_en timestamptz default now()
);

create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  email text,
  tipo_mueble text,
  descripcion text,
  presupuesto text,
  creado_en timestamptz default now()
);

-- Habilita RLS
alter table productos enable row level security;
alter table cotizaciones enable row level security;

-- Cualquiera puede LEER el catálogo (es una página pública)
create policy "Lectura pública de productos"
  on productos for select
  using (true);

-- Cualquiera puede INSERTAR una cotización (formulario de contacto público)
create policy "Insertar cotizaciones desde el sitio"
  on cotizaciones for insert
  with check (true);

-- Nadie puede leer las cotizaciones desde el cliente (solo tú, desde el dashboard
-- de Supabase o con la service_role key en un backend propio)

-- === Panel de administración (/admin) ===

-- Gestión de productos solo para usuarios autenticados (el admin)
create policy "Admin puede insertar productos"
  on productos for insert
  to authenticated
  with check (true);

create policy "Admin puede editar productos"
  on productos for update
  to authenticated
  using (true);

create policy "Admin puede borrar productos"
  on productos for delete
  to authenticated
  using (true);

-- Lectura y borrado de cotizaciones solo para el admin autenticado
create policy "Admin puede leer cotizaciones"
  on cotizaciones for select
  to authenticated
  using (true);

create policy "Admin puede borrar cotizaciones"
  on cotizaciones for delete
  to authenticated
  using (true);

-- Bucket público para imágenes de productos
insert into storage.buckets (id, name, public)
values ('productos-imagenes', 'productos-imagenes', true)
on conflict (id) do nothing;

create policy "Lectura pública de imágenes"
  on storage.objects for select
  using (bucket_id = 'productos-imagenes');

create policy "Admin puede subir imágenes"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'productos-imagenes');

create policy "Admin puede borrar imágenes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'productos-imagenes');

-- === Sistema de roles (agregado 2026-07-20) ===
-- Ejecuta TODO este bloque de una sola vez, en el orden en que aparece.
-- Antes de correrlo, reemplaza 'TU_CORREO_ADMIN_AQUI' más abajo por el
-- correo real de tu cuenta admin actual (Authentication > Users en el dashboard).

-- 1. Tabla de perfiles (rol + permisos por sección del panel admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'usuario' check (role in ('admin', 'usuario')),
  permisos jsonb not null default '{"productos": false, "cotizaciones": false}'::jsonb,
  creado_en timestamptz default now()
);

-- 2. Funciones helper (security definer: evitan recursión de RLS sobre profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.has_permission(seccion text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role = 'admin' or coalesce((permisos ->> seccion)::boolean, false)
     from public.profiles
     where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.has_permission(text) to authenticated, anon;

-- 3. Trigger: crea automáticamente el perfil (rol "usuario" por defecto) al crear un auth.user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, permisos)
  values (new.id, new.email, 'usuario', '{"productos": false, "cotizaciones": false}'::jsonb)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Trigger: impide degradar al último admin restante (blindaje aunque el
--    cambio venga de la UI, del SQL Editor, o de cualquier otro lado)
create or replace function public.prevent_last_admin_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and new.role <> 'admin' then
    if (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'No puedes quitar el rol admin al único administrador restante.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists before_profile_update_check_last_admin on public.profiles;
create trigger before_profile_update_check_last_admin
  before update on public.profiles
  for each row execute function public.prevent_last_admin_demotion();

-- 5. Backfill del admin actual — DEBE correrse antes del paso 6, o tu propia
--    sesión admin pierde acceso en cuanto se activen las policies nuevas.
insert into public.profiles (id, email, role, permisos)
select id, email, 'admin', '{"productos": true, "cotizaciones": true}'::jsonb
from auth.users
where email = 'TU_CORREO_ADMIN_AQUI'
on conflict (id) do update set role = 'admin', permisos = excluded.permisos;

-- 6. Reemplaza las policies "to authenticated" (todo-o-nada) por chequeo de permiso

alter table public.profiles enable row level security;

create policy "Ver el propio perfil o si eres admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or is_admin());

create policy "Admin puede actualizar cualquier perfil"
  on public.profiles for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin puede insertar productos" on productos;
drop policy if exists "Admin puede editar productos" on productos;
drop policy if exists "Admin puede borrar productos" on productos;

create policy "Con permiso pueden insertar productos"
  on productos for insert to authenticated
  with check (has_permission('productos'));

create policy "Con permiso pueden editar productos"
  on productos for update to authenticated
  using (has_permission('productos'))
  with check (has_permission('productos'));

create policy "Con permiso pueden borrar productos"
  on productos for delete to authenticated
  using (has_permission('productos'));

drop policy if exists "Admin puede leer cotizaciones" on cotizaciones;
drop policy if exists "Admin puede borrar cotizaciones" on cotizaciones;

create policy "Con permiso pueden leer cotizaciones"
  on cotizaciones for select to authenticated
  using (has_permission('cotizaciones'));

create policy "Con permiso pueden borrar cotizaciones"
  on cotizaciones for delete to authenticated
  using (has_permission('cotizaciones'));

drop policy if exists "Admin puede subir imágenes" on storage.objects;
drop policy if exists "Admin puede borrar imágenes" on storage.objects;

create policy "Con permiso pueden subir imágenes"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'productos-imagenes' and has_permission('productos'));

create policy "Con permiso pueden borrar imágenes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'productos-imagenes' and has_permission('productos'));

-- === Pagos con Stripe (agregado 2026-07-20) ===

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references public.productos(id) on delete set null,
  producto_nombre text not null,
  monto numeric not null,
  nombre_cliente text,
  email_cliente text,
  stripe_session_id text unique not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado')),
  creado_en timestamptz default now()
);

alter table public.pedidos enable row level security;
-- Sin policies de select/insert/update: toda escritura pasa por las Edge
-- Functions con la service_role key. Lectura pública solo vía la función
-- de abajo (filtra por session_id, un token opaco de la URL, no por usuario).

alter table public.cotizaciones
  add column if not exists anticipo_monto numeric,
  add column if not exists anticipo_estado text check (anticipo_estado in ('pendiente', 'pagado', 'cancelado')),
  add column if not exists stripe_session_id text unique;

create or replace function public.get_pedido_by_session(p_session_id text)
returns table (nombre_producto text, monto numeric, estado text)
language sql
security definer
set search_path = public
stable
as $$
  select producto_nombre, monto, estado
  from public.pedidos
  where stripe_session_id = p_session_id
  limit 1;
$$;

grant execute on function public.get_pedido_by_session(text) to anon, authenticated;

create or replace function public.get_cotizacion_pago_by_session(p_session_id text)
returns table (nombre text, monto numeric, estado text)
language sql
security definer
set search_path = public
stable
as $$
  select nombre, anticipo_monto, anticipo_estado
  from public.cotizaciones
  where stripe_session_id = p_session_id
  limit 1;
$$;

grant execute on function public.get_cotizacion_pago_by_session(text) to anon, authenticated;

-- === Subcategoría de Salas (agregado 2026-07-21) ===

alter table public.productos
  add column if not exists subcategoria text;

-- === Colores y galería de fotos (agregado 2026-07-21) ===

alter table public.productos
  add column if not exists colores jsonb default '[]'::jsonb,
  add column if not exists imagenes text[] default '{}';

-- === Banners administrables (agregado 2026-07-21) ===

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('inicio', 'catalogo')),
  imagen text not null,
  orden integer not null default 0,
  creado_en timestamptz default now()
);

alter table public.banners enable row level security;

create policy "Lectura pública de banners"
  on banners for select
  using (true);

create policy "Con permiso pueden insertar banners"
  on banners for insert to authenticated
  with check (has_permission('productos'));

create policy "Con permiso pueden borrar banners"
  on banners for delete to authenticated
  using (has_permission('productos'));

-- === Portadas de categoría para /catalogo (agregado 2026-07-21) ===

create table if not exists public.categoria_portadas (
  id uuid primary key default gen_random_uuid(),
  categoria text not null unique,
  imagen text not null,
  creado_en timestamptz default now()
);

alter table public.categoria_portadas enable row level security;

create policy "Lectura pública de portadas de categoría"
  on categoria_portadas for select
  using (true);

create policy "Con permiso pueden insertar portadas de categoría"
  on categoria_portadas for insert to authenticated
  with check (has_permission('productos'));

create policy "Con permiso pueden actualizar portadas de categoría"
  on categoria_portadas for update to authenticated
  using (has_permission('productos'))
  with check (has_permission('productos'));

create policy "Con permiso pueden borrar portadas de categoría"
  on categoria_portadas for delete to authenticated
  using (has_permission('productos'));

-- === Galería de imágenes por categoría (agregado 2026-07-22) ===

create table if not exists public.categoria_imagenes (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  imagen text not null,
  orden integer not null default 0,
  creado_en timestamptz default now()
);

alter table public.categoria_imagenes enable row level security;

create policy "Lectura pública de galería de categoría"
  on categoria_imagenes for select
  using (true);

create policy "Con permiso pueden insertar galería de categoría"
  on categoria_imagenes for insert to authenticated
  with check (has_permission('productos'));

create policy "Con permiso pueden borrar galería de categoría"
  on categoria_imagenes for delete to authenticated
  using (has_permission('productos'));

-- === Pago del carrito con Stripe (agregado 2026-07-22) ===

create table if not exists public.carrito_ordenes (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  monto numeric not null,
  nombre_cliente text,
  email_cliente text,
  stripe_session_id text unique not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado')),
  creado_en timestamptz default now()
);

alter table public.carrito_ordenes enable row level security;
-- Mismo patrón que pedidos: sin policies de select/insert/update, toda
-- escritura pasa por la Edge Function con la service_role key. Lectura
-- pública solo vía la función de abajo, filtrando por session_id (un token
-- opaco de la URL, no por usuario).

create or replace function public.get_carrito_orden_by_session(p_session_id text)
returns table (items jsonb, monto numeric, estado text)
language sql
security definer
set search_path = public
stable
as $$
  select items, monto, estado
  from public.carrito_ordenes
  where stripe_session_id = p_session_id
  limit 1;
$$;

grant execute on function public.get_carrito_orden_by_session(text) to anon, authenticated;

-- === Inventario y ventas (agregado 2026-07-22, con stock por color 2026-07-23) ===

-- Stock general, usado solo para piezas SIN colores registrados.
-- Las piezas con colores llevan su stock dentro de cada elemento de
-- productos.colores (jsonb): {"nombre": "Azul", "hex": "#...", "stock": 5}.
alter table public.productos
  add column if not exists stock integer not null default 0;

-- El pedido de compra directa también necesita recordar qué color se
-- compró, para poder descontar el color correcto al confirmarse el pago.
alter table public.pedidos
  add column if not exists color text;

-- Set/actualiza el inventario de una pieza SIN colores. Usado por el
-- apartado "Inventario" del admin. Solo con permiso de productos o de
-- inventario.
create or replace function public.actualizar_stock(p_producto_id uuid, p_stock integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_permission('productos') or has_permission('inventario')) then
    raise exception 'No tienes permiso para actualizar el inventario.';
  end if;
  if p_stock < 0 then
    raise exception 'El inventario no puede ser negativo.';
  end if;
  update public.productos set stock = p_stock where id = p_producto_id;
end;
$$;

grant execute on function public.actualizar_stock(uuid, integer) to authenticated;

-- Set/actualiza el inventario de UN color específico de una pieza.
create or replace function public.actualizar_stock_color(p_producto_id uuid, p_color_nombre text, p_stock integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (has_permission('productos') or has_permission('inventario')) then
    raise exception 'No tienes permiso para actualizar el inventario.';
  end if;
  if p_stock < 0 then
    raise exception 'El inventario no puede ser negativo.';
  end if;

  update public.productos
  set colores = (
    select jsonb_agg(
      case when (c ->> 'nombre') = p_color_nombre
        then c || jsonb_build_object('stock', p_stock)
        else c
      end
    )
    from jsonb_array_elements(colores) as c
  )
  where id = p_producto_id;
end;
$$;

grant execute on function public.actualizar_stock_color(uuid, text, integer) to authenticated;

-- Descuenta stock tras una compra confirmada. Si p_color va, descuenta del
-- color correspondiente dentro de productos.colores; si no, del stock
-- general. Solo la llaman las Edge Functions con la service_role key (no
-- se otorga a anon/authenticated).
drop function if exists public.descontar_stock(uuid, integer);

create or replace function public.descontar_stock(p_producto_id uuid, p_cantidad integer, p_color text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_color is null then
    update public.productos
    set stock = greatest(stock - p_cantidad, 0)
    where id = p_producto_id;
  else
    update public.productos
    set colores = (
      select jsonb_agg(
        case when (c ->> 'nombre') = p_color
          then c || jsonb_build_object('stock', greatest(coalesce((c ->> 'stock')::integer, 0) - p_cantidad, 0))
          else c
        end
      )
      from jsonb_array_elements(colores) as c
    )
    where id = p_producto_id;
  end if;
end;
$$;

revoke execute on function public.descontar_stock(uuid, integer, text) from public;

-- Ventas unificadas (compra directa + carrito + anticipos de cotización)
-- para el apartado "Ventas" del admin. Solo con permiso de ventas.
create or replace function public.listar_ventas()
returns table (
  id uuid,
  tipo text,
  descripcion text,
  monto numeric,
  cliente text,
  creado_en timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not (has_permission('ventas')) then
    raise exception 'No tienes permiso para ver las ventas.';
  end if;

  return query
    select p.id, 'producto'::text,
      p.producto_nombre || case when p.color is not null then ' (' || p.color || ')' else '' end,
      p.monto, p.nombre_cliente, p.creado_en
    from public.pedidos p
    where p.estado = 'pagado'
    union all
    select co.id, 'carrito'::text,
      (select string_agg(
        (item ->> 'nombre') ||
        case when (item ->> 'color') is not null then ' (' || (item ->> 'color') || ')' else '' end ||
        ' x' || (item ->> 'cantidad'),
        ', ')
       from jsonb_array_elements(co.items) as item),
      co.monto, co.nombre_cliente, co.creado_en
    from public.carrito_ordenes co
    where co.estado = 'pagado'
    union all
    select c.id, 'anticipo'::text, c.nombre, c.anticipo_monto, c.nombre, c.creado_en
    from public.cotizaciones c
    where c.anticipo_estado = 'pagado'
    order by creado_en desc;
end;
$$;

grant execute on function public.listar_ventas() to authenticated;
