import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'
import { useCart } from '../cart/CartContext'

export default function PaymentSuccess() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const tipo = searchParams.get('tipo')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { vaciar } = useCart()

  useEffect(() => {
    if (!sessionId) {
      setCargando(false)
      return
    }

    async function cargar() {
      const rpc =
        tipo === 'cotizacion'
          ? 'get_cotizacion_pago_by_session'
          : tipo === 'carrito'
            ? 'get_carrito_orden_by_session'
            : 'get_pedido_by_session'
      const { data } = await supabase.rpc(rpc, { p_session_id: sessionId })
      const fila = data?.[0] ?? null
      setResultado(fila)
      setCargando(false)
      if (tipo === 'carrito' && fila?.estado === 'pagado') vaciar()
    }

    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, tipo])

  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('paymentSuccess.kicker')}</p>
      <h1 className="font-display text-4xl text-parchment mb-6">{t('paymentSuccess.titulo')}</h1>

      {cargando ? (
        <p className="font-mono text-sm text-muted">{t('paymentSuccess.confirmando')}</p>
      ) : resultado && tipo === 'carrito' ? (
        <div className="font-mono text-sm text-parchment/90">
          <ul className="text-left space-y-2 mb-4">
            {resultado.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 border-b border-line pb-2">
                <span>
                  {item.nombre}
                  {item.color ? ` (${item.color})` : ''} × {item.cantidad}
                </span>
                <span className="text-walnut2 shrink-0">
                  ${(item.cantidad * Number(item.precio)).toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-walnut2">${Number(resultado.monto).toLocaleString('en-US')} USD</p>
          <p className="text-muted uppercase tracking-widest text-xs mt-2">
            {t('paymentSuccess.estado')}: {resultado.estado}
          </p>
        </div>
      ) : resultado ? (
        <div className="font-mono text-sm text-parchment/90 space-y-2">
          <p>{resultado.nombre_producto ?? resultado.nombre}</p>
          <p className="text-walnut2">${Number(resultado.monto).toLocaleString('en-US')} USD</p>
          <p className="text-muted uppercase tracking-widest text-xs">
            {t('paymentSuccess.estado')}: {resultado.estado}
          </p>
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">{t('paymentSuccess.noEncontrado')}</p>
      )}

      <Link
        to="/catalogo"
        className="inline-block mt-10 bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
      >
        {t('paymentSuccess.volverCatalogo')}
      </Link>
    </section>
  )
}
