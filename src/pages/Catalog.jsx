import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { sampleProducts, categorias } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria } from '../i18n/translations'

const categoriasGrid = categorias.filter((c) => c !== 'Todos')

export default function Catalog() {
  const { lang, t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [productos, setProductos] = useState(sampleProducts)
  const [cargando, setCargando] = useState(true)
  const [bannerCatalogo, setBannerCatalogo] = useState(null)
  const [portadas, setPortadas] = useState([])
  const [galeriaCategoria, setGaleriaCategoria] = useState([])

  useEffect(() => {
    async function cargarProductos() {
      const { data, error } = await supabase.from('productos').select('*').order('creado_en', { ascending: false })
      // Si Supabase no está configurado o la tabla está vacía, usamos los datos de ejemplo
      if (!error && data && data.length > 0) {
        setProductos(data)
      }
      setCargando(false)
    }
    cargarProductos()

    async function cargarBanner() {
      const { data } = await supabase.from('banners').select('*').eq('tipo', 'catalogo').limit(1).maybeSingle()
      setBannerCatalogo(data)
    }
    cargarBanner()

    async function cargarPortadas() {
      const { data } = await supabase.from('categoria_portadas').select('*')
      setPortadas(data ?? [])
    }
    cargarPortadas()
  }, [])

  const activa = searchParams.get('categoria') || ''
  const subcategoria = searchParams.get('subcategoria') || ''
  const busqueda = searchParams.get('buscar') || ''

  const mostrarSelector = !activa && !busqueda

  useEffect(() => {
    if (!activa || activa === 'Todos') {
      setGaleriaCategoria([])
      return
    }
    async function cargarGaleria() {
      const { data } = await supabase
        .from('categoria_imagenes')
        .select('*')
        .eq('categoria', activa)
        .order('orden', { ascending: true })
      setGaleriaCategoria(data ?? [])
    }
    cargarGaleria()
  }, [activa])

  const porCategoria =
    !activa || activa === 'Todos' ? productos : productos.filter((p) => p.categoria === activa)

  const porSubcategoria = subcategoria
    ? porCategoria.filter((p) => p.subcategoria === subcategoria)
    : porCategoria

  const textoBusqueda = busqueda.trim().toLowerCase()
  const filtrados = textoBusqueda
    ? porSubcategoria.filter((p) =>
        [p.nombre, p.descripcion]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(textoBusqueda))
      )
    : porSubcategoria

  if (mostrarSelector) {
    return (
      <section className="max-w-6xl mx-auto px-6 py-16">
        {bannerCatalogo && (
          <div className="rounded-sm overflow-hidden border border-brass/40 mb-10">
            <img src={bannerCatalogo.imagen} alt="" className="w-full h-auto" />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoriasGrid.map((categoria) => {
            const portada = portadas.find((p) => p.categoria === categoria)
            return (
              <Link
                key={categoria}
                to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
                className="group relative aspect-[4/5] rounded-sm overflow-hidden border border-line hover:border-brass/60 transition-colors bg-surface2"
              >
                {portada && (
                  <img
                    src={portada.imagen}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent flex flex-col items-center justify-end p-5">
                  <h2 className="font-display text-2xl text-parchment mb-2 text-center">
                    {traducirCategoria(categoria, lang)}
                  </h2>
                  <span className="font-mono text-[11px] tracking-widest text-brass uppercase">
                    {t('catalog.verCatalogo')}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      {galeriaCategoria.length > 0 && (
        <div className="flex gap-4 overflow-x-auto mb-10 pb-2">
          {galeriaCategoria.map((img) => (
            <img
              key={img.id}
              src={img.imagen}
              alt=""
              className="h-48 w-auto rounded-sm border border-line object-cover shrink-0"
            />
          ))}
        </div>
      )}

      {cargando ? (
        <p className="font-mono text-sm text-muted">{t('catalog.cargando')}</p>
      ) : filtrados.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('catalog.vacio')}</p>
      ) : (
        <div className="grid gap-4">
          {filtrados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </section>
  )
}
