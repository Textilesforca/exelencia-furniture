import { writeFileSync, readFileSync } from 'node:fs'

const SITIO = 'https://exelencia-furniture.vercel.app'

const paginasEstaticas = [
  { ruta: '/', prioridad: '1.0' },
  { ruta: '/catalogo', prioridad: '0.9' },
  { ruta: '/entrega', prioridad: '0.6' },
  { ruta: '/contacto', prioridad: '0.6' },
]

function leerEnv() {
  try {
    const contenido = readFileSync('.env', 'utf8')
    const env = {}
    for (const linea of contenido.split('\n')) {
      const i = linea.indexOf('=')
      if (i === -1) continue
      env[linea.slice(0, i).trim()] = linea.slice(i + 1).trim()
    }
    return env
  } catch {
    return {}
  }
}

async function obtenerProductos() {
  const env = { ...leerEnv(), ...process.env }
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return []

  try {
    const res = await fetch(`${url}/rest/v1/productos?select=id,creado_en`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

function urlEntry(ruta, prioridad, fecha) {
  return `  <url>
    <loc>${SITIO}${ruta}</loc>
    ${fecha ? `<lastmod>${fecha}</lastmod>\n    ` : ''}<priority>${prioridad}</priority>
  </url>`
}

async function generar() {
  const productos = await obtenerProductos()

  const entradas = [
    ...paginasEstaticas.map((p) => urlEntry(p.ruta, p.prioridad)),
    ...productos.map((p) =>
      urlEntry(`/catalogo/${p.id}`, '0.7', p.creado_en ? p.creado_en.slice(0, 10) : undefined)
    ),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.join('\n')}
</urlset>
`

  writeFileSync('public/sitemap.xml', xml)
  console.log(`sitemap.xml generado con ${paginasEstaticas.length} páginas estáticas y ${productos.length} productos`)
}

generar()
