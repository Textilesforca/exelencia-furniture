import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import BlueprintDivider from '../components/BlueprintDivider'
import { sampleProducts } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'

export default function Catalog() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [productos, setProductos] = useState(sampleProducts)
  const [cargando, setCargando] = useState(true)

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
  }, [])

  const activa = searchParams.get('categoria') || 'Todos'
  const subcategoria = searchParams.get('subcategoria') || ''
  const busqueda = searchParams.get('buscar') || ''

  const porCategoria =
    activa === 'Todos' ? productos : productos.filter((p) => p.categoria === activa)

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

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('catalog.kicker')}</p>
      <h1 className="font-display text-4xl text-parchment mb-8">{t('catalog.titulo')}</h1>

      <BlueprintDivider />

      {cargando ? (
        <p className="font-mono text-sm text-muted mt-8">{t('catalog.cargando')}</p>
      ) : filtrados.length === 0 ? (
        <p className="font-mono text-sm text-muted mt-8">{t('catalog.vacio')}</p>
      ) : (
        <div className="grid gap-4 mt-8">
          {filtrados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </section>
  )
}
