import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const tipo = searchParams.get('tipo')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setCargando(false)
      return
    }

    async function cargar() {
      const rpc = tipo === 'cotizacion' ? 'get_cotizacion_pago_by_session' : 'get_pedido_by_session'
      const { data } = await supabase.rpc(rpc, { p_session_id: sessionId })
      setResultado(data?.[0] ?? null)
      setCargando(false)
    }

    cargar()
  }, [sessionId, tipo])

  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Pago recibido</p>
      <h1 className="font-display text-4xl text-parchment mb-6">¡Gracias por tu pago!</h1>

      {cargando ? (
        <p className="font-mono text-sm text-muted">Confirmando…</p>
      ) : resultado ? (
        <div className="font-mono text-sm text-parchment/90 space-y-2">
          <p>{resultado.nombre_producto ?? resultado.nombre}</p>
          <p className="text-walnut2">${Number(resultado.monto).toLocaleString('es-MX')} MXN</p>
          <p className="text-muted uppercase tracking-widest text-xs">Estado: {resultado.estado}</p>
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">
          No pudimos encontrar el detalle de este pago, pero si tu banco confirmó el cargo, ya lo recibimos.
        </p>
      )}

      <Link
        to="/catalogo"
        className="inline-block mt-10 bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
      >
        Volver al catálogo
      </Link>
    </section>
  )
}
