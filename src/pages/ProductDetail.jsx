import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sampleProducts } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import BlueprintDivider from '../components/BlueprintDivider'
import ImageLightbox from '../components/ImageLightbox'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria } from '../i18n/translations'
import { useCart } from '../cart/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const { lang, t } = useLanguage()
  const { agregar } = useCart()
  const [producto, setProducto] = useState(() => sampleProducts.find((p) => p.id === id))
  const [cargando, setCargando] = useState(!producto)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [comprando, setComprando] = useState(false)
  const [errorCompra, setErrorCompra] = useState('')
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null)
  const [colorSeleccionado, setColorSeleccionado] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    if (producto) return
    async function cargar() {
      const { data } = await supabase.from('productos').select('*').eq('id', id).single()
      if (data) setProducto(data)
      setCargando(false)
    }
    cargar()
  }, [id, producto])

  useEffect(() => {
    if (!producto) return
    setImagenSeleccionada(producto.imagen)
    setColorSeleccionado(producto.colores?.[0]?.nombre ?? null)
    setCantidad(1)
  }, [producto])

  const stock = Number(producto?.stock ?? 0)
  const sinExistencias = stock <= 0

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

  function handleAgregarCarrito() {
    agregar(producto, cantidad, colorSeleccionado)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  if (cargando) {
    return <p className="max-w-6xl mx-auto px-6 py-16 font-mono text-sm text-muted">{t('productDetail.cargando')}</p>
  }

  if (!producto) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16">
        <p className="font-display text-2xl text-parchment mb-4">{t('productDetail.noEncontrada')}</p>
        <Link to="/catalogo" className="text-brass underline underline-offset-4">
          {t('productDetail.volverCatalogo')}
        </Link>
      </div>
    )
  }

  const esProductoReal = UUID_REGEX.test(producto.id)
  const nombre = producto.nombre
  const material = producto.material
  const descripcion = producto.descripcion
  const galeria = [producto.imagen, ...(producto.imagenes ?? [])].filter(Boolean)

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
      <div>
        <div className="aspect-[4/3] bg-surface2 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full h-full cursor-zoom-in"
          >
            <img src={imagenSeleccionada} alt={nombre} className="w-full h-full object-cover" />
          </button>
        </div>

        {galeria.length > 1 && (
          <div className="flex gap-3 mt-4">
            {galeria.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => setImagenSeleccionada(url)}
                className={`w-16 h-16 rounded-sm overflow-hidden border transition-colors ${
                  imagenSeleccionada === url ? 'border-brass' : 'border-line hover:border-brass/60'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        src={imagenSeleccionada}
        alt={nombre}
        onClose={() => setLightboxOpen(false)}
      />

      <div>
        <p className="font-mono text-[11px] tracking-widest text-brass uppercase">
          {traducirCategoria(producto.categoria, lang)}
        </p>
        <h1 className="font-display text-4xl text-parchment mt-2">{nombre}</h1>
        <p className="text-muted mt-3">{material}</p>
        <p className="text-parchment/80 mt-6">{descripcion}</p>

        {producto.colores?.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-[11px] tracking-widest text-muted uppercase mb-2">
              {t('productDetail.color')}
              {colorSeleccionado ? `: ${colorSeleccionado}` : ''}
            </p>
            <div className="flex items-center gap-2">
              {producto.colores.map((color) => (
                <button
                  key={color.nombre}
                  type="button"
                  onClick={() => setColorSeleccionado(color.nombre)}
                  title={color.nombre}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-colors ${
                    colorSeleccionado === color.nombre ? 'border-brass' : 'border-transparent hover:border-line'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="my-8">
          <BlueprintDivider label={t('productDetail.fichaTecnica')} />
        </div>

        <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-8">
          <Dimension label={t('productDetail.ancho')} valor={producto.ancho} />
          <Dimension label={t('productDetail.alto')} valor={producto.alto} />
          <Dimension label={t('productDetail.fondo')} valor={producto.profundidad} />
        </div>

        <p className="font-mono text-lg text-walnut2 mb-6">
          {t('productDetail.desde')} ${Number(producto.precio_desde).toLocaleString('en-US')} USD
        </p>

        {esProductoReal && sinExistencias && (
          <p className="font-mono text-xs uppercase tracking-widest text-red-400 mb-6">
            {t('productDetail.sinExistencias')}
          </p>
        )}

        {esProductoReal && !sinExistencias && (
          <div className="flex items-center gap-4 mb-6">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
              {t('productDetail.cantidad')}
            </span>
            <div className="flex items-center border border-line rounded-sm">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                className="w-9 h-9 text-parchment hover:text-brass transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center font-mono text-parchment">{cantidad}</span>
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(stock, c + 1))}
                className="w-9 h-9 text-parchment hover:text-brass transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {errorCompra && <p className="text-sm text-red-400 mb-3">{errorCompra}</p>}

        <div className="flex flex-wrap gap-3">
          {esProductoReal && !sinExistencias && (
            <button
              type="button"
              onClick={handleAgregarCarrito}
              className="inline-block border border-brass text-brass font-body font-medium px-6 py-3 rounded-sm hover:bg-brass hover:text-ink transition-colors"
            >
              {agregado ? t('productDetail.agregado') : t('productDetail.agregarCarrito')}
            </button>
          )}

          {esProductoReal && !sinExistencias && (
            <button
              type="button"
              onClick={handleComprar}
              disabled={comprando}
              className="inline-block bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50"
            >
              {comprando ? t('productDetail.redirigiendo') : t('productDetail.comprar')}
            </button>
          )}

          <Link
            to="/contacto"
            className="inline-block border border-line text-parchment font-body font-medium px-6 py-3 rounded-sm hover:border-brass/60 transition-colors"
          >
            {t('productDetail.cotizarMedida')}
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
