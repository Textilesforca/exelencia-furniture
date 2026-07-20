import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'
import CategoryFilter from '../components/CategoryFilter'
import BlueprintDivider from '../components/BlueprintDivider'
import { sampleProducts, categorias } from '../data/products'
import { supabase } from '../lib/supabaseClient'

export default function Catalog() {
  const [productos, setProductos] = useState(sampleProducts)
  const [activa, setActiva] = useState('Todos')
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

  const filtrados =
    activa === 'Todos' ? productos : productos.filter((p) => p.categoria === activa)

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Catálogo completo</p>
      <h1 className="font-display text-4xl text-parchment mb-8">Piezas listas para adaptarse a tu espacio</h1>

      <BlueprintDivider />

      <div className="my-8">
        <CategoryFilter categorias={categorias} activa={activa} onChange={setActiva} />
      </div>

      {cargando ? (
        <p className="font-mono text-sm text-muted">Cargando catálogo…</p>
      ) : filtrados.length === 0 ? (
        <p className="font-mono text-sm text-muted">Aún no hay piezas en esta categoría.</p>
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
