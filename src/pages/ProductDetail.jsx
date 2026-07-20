import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sampleProducts } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import BlueprintDivider from '../components/BlueprintDivider'
import ImageLightbox from '../components/ImageLightbox'

export default function ProductDetail() {
  const { id } = useParams()
  const [producto, setProducto] = useState(() => sampleProducts.find((p) => p.id === id))
  const [cargando, setCargando] = useState(!producto)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [comprando, setComprando] = useState(false)
  const [errorCompra, setErrorCompra] = useState('')

  useEffect(() => {
    if (producto) return
    async function cargar() {
      const { data } = await supabase.from('productos').select('*').eq('id', id).single()
      if (data) setProducto(data)
      setCargando(false)
    }
    cargar()
  }, [id, producto])

  async function handleComprar() {
    setComprando(true)
    setErrorCompra('')

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { producto_id: producto.id },
    })

    if (error) {
      let mensaje = error.message
      try {
        const cuerpo = await error.context.json()
        if (cuerpo?.error) mensaje = cuerpo.error
      } catch {
        // sin body JSON, usamos el mensaje genérico
      }
      setErrorCompra(mensaje)
      setComprando(false)
      return
    }

    window.location.assign(data.url)
  }

  if (cargando) {
    return <p className="max-w-6xl mx-auto px-6 py-16 font-mono text-sm text-muted">Cargando pieza…</p>
  }

  if (!producto) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-display text-2xl text-parchment mb-4">No encontramos esta pieza.</p>
        <Link to="/catalogo" className="text-brass underline underline-offset-4">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const esProductoReal = UUID_REGEX.test(producto.id)

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
      <div className="aspect-[4/3] bg-surface2 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="w-full h-full cursor-zoom-in"
        >
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
        </button>
      </div>

      <ImageLightbox
        open={lightboxOpen}
        src={producto.imagen}
        alt={producto.nombre}
        onClose={() => setLightboxOpen(false)}
      />

      <div>
        <p className="font-mono text-[11px] tracking-widest text-brass uppercase">{producto.categoria}</p>
        <h1 className="font-display text-4xl text-parchment mt-2">{producto.nombre}</h1>
        <p className="text-muted mt-3">{producto.material}</p>
        <p className="text-parchment/80 mt-6">{producto.descripcion}</p>

        <div className="my-8">
          <BlueprintDivider label="Ficha técnica" />
        </div>

        <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-8">
          <Dimension label="Ancho" valor={producto.ancho} />
          <Dimension label="Alto" valor={producto.alto} />
          <Dimension label="Fondo" valor={producto.profundidad} />
        </div>

        <p className="font-mono text-lg text-walnut2 mb-8">
          Desde ${Number(producto.precio_desde).toLocaleString('es-MX')} MXN
        </p>

        {errorCompra && <p className="text-sm text-red-400 mb-3">{errorCompra}</p>}

        <div className="flex flex-wrap gap-3">
          {esProductoReal && (
            <button
              type="button"
              onClick={handleComprar}
              disabled={comprando}
              className="inline-block bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50"
            >
              {comprando
                ? 'Redirigiendo…'
                : `Comprar esta pieza — $${Number(producto.precio_desde).toLocaleString('es-MX')} (medida estándar)`}
            </button>
          )}

          <Link
            to="/contacto"
            className="inline-block border border-line text-parchment font-body font-medium px-6 py-3 rounded-sm hover:border-brass/60 transition-colors"
          >
            Cotizar a mi medida
          </Link>
        </div>
      </div>
    </section>
  )
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Dimension({ label, valor }) {
  return (
    <div className="border border-line rounded-sm px-3 py-3 text-center">
      <p className="text-muted text-[11px] uppercase tracking-widest">{label}</p>
      <p className="text-parchment mt-1">{valor} cm</p>
    </div>
  )
}
