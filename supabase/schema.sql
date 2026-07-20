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
