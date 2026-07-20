import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

async function mensajeDeError(error) {
  if (!error) return ''
  try {
    const body = await error.context.json()
    if (body?.error) return body.error
  } catch {
    // el error no traía body JSON, usamos el mensaje genérico
  }
  return error.message
}

export default function QuotesList() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [montos, setMontos] = useState({})
  const [generandoId, setGenerandoId] = useState(null)
  const [linksGenerados, setLinksGenerados] = useState({})
  const [errores, setErrores] = useState({})

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('creado_en', { ascending: false })
    if (!error) setCotizaciones(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function handleEliminar(id) {
    if (!window.confirm('¿Eliminar esta cotización?')) return
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
    if (!error) cargar()
  }

  async function handleGenerarLink(cotizacionId) {
    const monto = montos[cotizacionId]
    if (!monto || Number(monto) <= 0) {
      setErrores({ ...errores, [cotizacionId]: 'Ingresa un monto válido.' })
      return
    }

    setGenerandoId(cotizacionId)
    setErrores({ ...errores, [cotizacionId]: '' })

    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: { cotizacion_id: cotizacionId, monto: Number(monto) },
    })

    if (error) {
      setErrores({ ...errores, [cotizacionId]: await mensajeDeError(error) })
      setGenerandoId(null)
      return
    }

    setLinksGenerados({ ...linksGenerados, [cotizacionId]: data.url })
    setGenerandoId(null)
    cargar()
  }

  function copiarLink(url) {
    navigator.clipboard.writeText(url)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">Cargando…</p>
  }

  if (cotizaciones.length === 0) {
    return <p className="font-mono text-sm text-muted">Aún no hay solicitudes de cotización.</p>
  }

  return (
    <ul className="grid gap-4">
      {cotizaciones.map((c) => (
        <li key={c.id} className="bg-surface border border-line rounded-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-parchment font-medium">{c.nombre}</p>
              <p className="font-mono text-xs text-muted mt-1">
                {new Date(c.creado_en).toLocaleString('es-MX')}
              </p>
            </div>
            <button
              onClick={() => handleEliminar(c.id)}
              className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline shrink-0"
            >
              Eliminar
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-4 text-sm text-parchment/90">
            <p><span className="text-muted">Teléfono: </span>{c.telefono}</p>
            {c.email && <p><span className="text-muted">Correo: </span>{c.email}</p>}
            {c.tipo_mueble && <p><span className="text-muted">Tipo de mueble: </span>{c.tipo_mueble}</p>}
            {c.presupuesto && <p><span className="text-muted">Presupuesto: </span>{c.presupuesto}</p>}
          </div>

          {c.descripcion && (
            <p className="text-sm text-parchment/80 mt-3 border-t border-line pt-3">{c.descripcion}</p>
          )}

          <div className="mt-4 border-t border-line pt-4">
            {c.anticipo_estado === 'pagado' ? (
              <p className="font-mono text-xs uppercase tracking-widest text-brass">
                Anticipo recibido ✓ — ${Number(c.anticipo_monto).toLocaleString('es-MX')} MXN
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Monto del anticipo (MXN)"
                  value={montos[c.id] ?? ''}
                  onChange={(e) => setMontos({ ...montos, [c.id]: e.target.value })}
                  className="bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors w-52"
                />
                <button
                  onClick={() => handleGenerarLink(c.id)}
                  disabled={generandoId === c.id}
                  className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50"
                >
                  {generandoId === c.id ? 'Generando…' : 'Generar link de pago'}
                </button>

                {linksGenerados[c.id] && (
                  <div className="flex items-center gap-2 w-full mt-1">
                    <input
                      readOnly
                      value={linksGenerados[c.id]}
                      className="flex-1 bg-surface2 border border-line rounded-sm px-3 py-2 text-xs text-parchment/80"
                    />
                    <button
                      onClick={() => copiarLink(linksGenerados[c.id])}
                      className="font-mono text-xs uppercase tracking-widest text-brass hover:underline shrink-0"
                    >
                      Copiar
                    </button>
                  </div>
                )}

                {errores[c.id] && <p className="text-xs text-red-400 w-full">{errores[c.id]}</p>}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
