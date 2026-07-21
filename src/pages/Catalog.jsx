import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CategoryFilter from '../components/CategoryFilter'
import BlueprintDivider from '../components/BlueprintDivider'
import { sampleProducts, categorias } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'

export default function Catalog() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState(sampleProducts)
  const [activa, setActiva] = useState(searchParams.get('categoria') || 'Todos')
  const [busqueda, setBusqueda] = useState(searchParams.get('buscar') || '')
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

  useEffect(() => {
    setActiva(searchParams.get('categoria') || 'Todos')
    setBusqueda(searchParams.get('buscar') || '')
  }, [searchParams])

  function handleCambiarCategoria(cat) {
    setActiva(cat)
    const params = new URLSearchParams(searchParams)
    if (cat === 'Todos') params.delete('categoria')
    else params.set('categoria', cat)
    setSearchParams(params)
  }

  const porCategoria =
    activa === 'Todos' ? productos : productos.filter((p) => p.categoria === activa)

  const textoBusqueda = busqueda.trim().toLowerCase()
  const filtrados = textoBusqueda
    ? porCategoria.filter((p) =>
        [p.nombre, p.nombre_en, p.descripcion, p.descripcion_en]
          .filter(Boolean)
          .some((campo) => campo.toLowerCase().includes(textoBusqueda))
      )
    : porCategoria

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('catalog.kicker')}</p>
      <h1 className="font-display text-4xl text-parchment mb-8">{t('catalog.titulo')}</h1>

      <BlueprintDivider />

      <div className="my-8">
        <CategoryFilter categorias={categorias} activa={activa} onChange={handleCambiarCategoria} />
      </div>

      {cargando ? (
        <p className="font-mono text-sm text-muted">{t('catalog.cargando')}</p>
      ) : filtrados.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('catalog.vacio')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      )}
    </section>
  )
}
