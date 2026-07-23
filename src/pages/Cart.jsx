import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useLanguage } from '../i18n/LanguageContext'
import { supabase } from '../lib/supabaseClient'

export default function Cart() {
  const { t } = useLanguage()
  const { items, quitar, actualizarCantidad } = useCart()
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState('')

  const total = items.reduce((suma, i) => suma + i.cantidad * Number(i.precio_desde), 0)

  async function handlePagar() {
    setPagando(true)
    setErrorPago('')

    const { data, error } = await supabase.functions.invoke('create-cart-checkout', {
      body: {
        items: items.map((i) => ({
          producto_id: i.productoId,
          color: i.color,
          cantidad: i.cantidad,
        })),
      },
    })

    if (error) {
      let mensaje = error.message
      try {
        const cuerpo = await error.context.json()
        if (cuerpo?.error) mensaje = cuerpo.error
      } catch {
        // sin body JSON, usamos el mensaje genérico
      }
      setErrorPago(mensaje)
      setPagando(false)
      return
    }

    window.location.assign(data.url)
  }

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl text-parchment mb-8">{t('cart.titulo')}</h1>

      {items.length === 0 ? (
        <div>
          <p className="font-mono text-sm text-muted mb-6">{t('cart.vacio')}</p>
          <Link
            to="/catalogo"
            className="inline-block bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
          >
            {t('productDetail.volverCatalogo')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-4 mb-8">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 bg-surface border border-line rounded-sm p-4">
                <img src={item.imagen} alt={item.nombre} className="w-20 h-20 object-cover rounded-sm bg-surface2" />
                <div className="flex-1 min-w-0">
                  <p className="text-parchment">{item.nombre}</p>
                  {item.color && <p className="font-mono text-xs text-muted mt-1">{t('productDetail.color')}: {item.color}</p>}
                  <p className="font-mono text-sm text-walnut2 mt-1">
                    ${Number(item.precio_desde).toLocaleString('en-US')} USD
                  </p>
                </div>
                <div className="flex items-center border border-line rounded-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-8 h-8 text-parchment hover:text-brass transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-sm text-parchment">{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-8 h-8 text-parchment hover:text-brass transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="font-mono text-sm text-parchment w-24 text-right shrink-0">
                  ${(item.cantidad * Number(item.precio_desde)).toLocaleString('en-US')}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(item.id)}
                  className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline shrink-0"
                >
                  {t('quotesList.eliminar')}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <p className="font-mono text-lg text-parchment">
              {t('cart.total')}: <span className="text-walnut2">${total.toLocaleString('en-US')} USD</span>
            </p>
          </div>

          {errorPago && <p className="font-mono text-xs text-red-400 mt-4">{errorPago}</p>}

          <button
            type="button"
            onClick={handlePagar}
            disabled={pagando}
            className="mt-6 w-full sm:w-auto bg-brass text-ink font-body font-medium px-8 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pagando ? t('cart.procesando') : t('cart.pagar')}
          </button>
        </>
      )}
    </section>
  )
}
