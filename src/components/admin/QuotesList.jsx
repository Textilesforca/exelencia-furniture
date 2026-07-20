import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function QuotesList() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)

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
        </li>
      ))}
    </ul>
  )
}
