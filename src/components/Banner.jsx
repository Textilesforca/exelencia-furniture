import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'
import { campoTraducido, traducirCategoria } from '../i18n/translations'

export default function Banner() {
  const { lang, t } = useLanguage()
  const [productos, setProductos] = useState([])
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(5)
      setProductos(data ?? [])
    }
    cargar()
  }, [])

  useEffect(() => {
    if (productos.length < 2) return
    const intervalo = setInterval(() => {
      setIndice((i) => (i + 1) % productos.length)
    }, 6000)
    return () => clearInterval(intervalo)
  }, [productos.length])

  if (productos.length === 0) return null

  const producto = productos[indice]
  const nombre = campoTraducido(producto, 'nombre', lang)

  function anterior() {
    setIndice((i) => (i - 1 + productos.length) % productos.length)
  }

  function siguiente() {
    setIndice((i) => (i + 1) % productos.length)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <div className="relative overflow-hidden rounded-sm border border-brass/40 bg-surface grid sm:grid-cols-2">
        <div className="relative aspect-[16/10] sm:aspect-auto bg-surface2">
          <img src={producto.imagen} alt={nombre} className="w-full h-full object-cover" />

          {productos.length > 1 && (
            <>
              <button
                type="button"
                onClick={anterior}
                aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={siguiente}
                aria-label="Siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase mb-4">
            {traducirCategoria(producto.categoria, lang)}
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-parchment mb-4">{nombre}</h2>
          <p className="font-mono text-lg text-walnut2 mb-8">
            {t('productCard.desde')} ${Number(producto.precio_desde).toLocaleString('es-MX')} MXN
          </p>
          <Link
            to={`/catalogo/${producto.id}`}
            className="inline-block bg-brass text-ink font-body font-medium px-8 py-3 rounded-sm hover:bg-walnut2 transition-colors w-fit"
          >
            {t('banner.boton')}
          </Link>

          {productos.length > 1 && (
            <div className="flex gap-2 mt-8">
              {productos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ir a la pieza ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === indice ? 'w-6 bg-brass' : 'w-1.5 bg-line'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
