# Custom & Designs — The Exelencia Furniture

Sitio web del catálogo de la mueblería, construido con **React + Vite** y **Supabase**, listo para desplegarse en **Vercel**.

## 1. Requisitos

- Node.js 18 o superior
- Una cuenta gratuita en [supabase.com](https://supabase.com)
- Una cuenta gratuita en [vercel.com](https://vercel.com)

## 2. Instalación local

```bash
npm install
cp .env.example .env
```

Abre `.env` y pon los datos de tu proyecto de Supabase (paso 3).

```bash
npm run dev
```

El sitio queda disponible en `http://localhost:5173`.

## 3. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **Project Settings > API** y copia:
   - `Project URL` → pégalo en `VITE_SUPABASE_URL`
   - `anon public key` → pégalo en `VITE_SUPABASE_ANON_KEY`
3. Ve a **SQL Editor** y ejecuta el contenido del archivo `supabase/schema.sql` de este proyecto.
   Esto crea dos tablas:
   - `productos`: tu catálogo (si la dejas vacía, el sitio muestra automáticamente los datos de ejemplo en `src/data/products.js`)
   - `cotizaciones`: donde caen las solicitudes del formulario de contacto
4. Para ver las cotizaciones que lleguen, ve a **Table Editor > cotizaciones** dentro de tu dashboard de Supabase.

### Cargar tus propios productos

Puedes agregar filas manualmente desde **Table Editor > productos** en Supabase, con estas columnas:
`nombre, categoria, material, ancho, alto, profundidad, precio_desde, imagen, descripcion`.

La `categoria` debe ser una de: `Salas`, `Comedores`, `Recámaras`, `Piezas a medida` (o edita
`src/data/products.js` para cambiar las categorías disponibles).

## 4. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel: **Add New Project** → importa el repositorio.
3. Framework detectado: **Vite** (no requiere configuración extra).
4. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Vercel te da una URL pública (ej. `exelencia-furniture.vercel.app`).

Cada vez que subas cambios a la rama principal de GitHub, Vercel vuelve a desplegar automáticamente.

## 5. Estructura del proyecto

```
src/
  components/   componentes reutilizables (tarjetas, formulario, nav, etc.)
  pages/        Home, Catalog, ProductDetail, Contact
  data/         datos de ejemplo del catálogo
  lib/          cliente de Supabase
supabase/
  schema.sql    esquema de tablas para copiar/pegar en el SQL Editor
```

## 6. Próximos pasos sugeridos

- Reemplazar las imágenes de ejemplo (Unsplash) por fotos reales de tus piezas.
- Conectar el envío del formulario de cotización a WhatsApp o correo (por ejemplo con un webhook
  de Supabase Edge Functions) además de guardarlo en la base de datos.
- Agregar un dominio propio en Vercel (**Settings > Domains**).
