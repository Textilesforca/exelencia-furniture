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
