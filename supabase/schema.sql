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
