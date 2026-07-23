import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'

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
  const { t } = useLanguage()
  const [cotizaciones, setCotizaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [montos, setMontos] = useState({})
  const [generandoClave, setGenerandoClave] = useState(null)
  const [linksGenerados, setLinksGenerados] = useState({})
  const [errores, setErrores] = useState({})
  const [montosTotales, setMontosTotales] = useState({})
  const [guardandoTotalId, setGuardandoTotalId] = useState(null)
  const [erroresTotal, setErroresTotal] = useState({})
  const [exitoTotalId, setExitoTotalId] = useState(null)

  async function cargar() {
    setCargando(true)
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('creado_en', { ascending: false })
    if (!error) {
      setCotizaciones(data ?? [])
      setMontosTotales(Object.fromEntries((data ?? []).map((c) => [c.id, c.monto_total ?? ''])))
    }
    setCargando(false)
  }

  async function handleGuardarMontoTotal(id) {
    const valor = montosTotales[id]
    if (valor === '' || valor == null || Number(valor) < 0) {
      setErroresTotal({ ...erroresTotal, [id]: t('quotesList.montoInvalido') })
      return
    }

    setGuardandoTotalId(id)
    setErroresTotal({ ...erroresTotal, [id]: '' })

    const { error } = await supabase.rpc('actualizar_monto_total', {
      p_cotizacion_id: id,
      p_monto_total: Number(valor),
    })

    if (error) {
      setErroresTotal({ ...erroresTotal, [id]: error.message })
      setGuardandoTotalId(null)
      return
    }

    setCotizaciones(cotizaciones.map((c) => (c.id === id ? { ...c, monto_total: Number(valor) } : c)))
    setGuardandoTotalId(null)
    setExitoTotalId(id)
    setTimeout(() => setExitoTotalId(null), 2000)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function handleEliminar(id) {
    if (!window.confirm(t('quotesList.confirmarEliminar'))) return
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
    if (!error) cargar()
  }

  async function handleGenerarLink(cotizacionId, concepto, montoSugerido) {
    const clave = `${cotizacionId}::${concepto}`
    const monto = montos[clave] ?? montoSugerido
    if (!monto || Number(monto) <= 0) {
      setErrores({ ...errores, [clave]: t('quotesList.montoInvalido') })
      return
    }

    setGenerandoClave(clave)
    setErrores({ ...errores, [clave]: '' })

    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: { cotizacion_id: cotizacionId, monto: Number(monto), concepto },
    })

    if (error) {
      setErrores({ ...errores, [clave]: await mensajeDeError(error) })
      setGenerandoClave(null)
      return
    }

    setLinksGenerados({ ...linksGenerados, [clave]: data.url })
    setGenerandoClave(null)
    cargar()
  }

  function copiarLink(url) {
    navigator.clipboard.writeText(url)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('quotesList.cargando')}</p>
  }

  if (cotizaciones.length === 0) {
    return <p className="font-mono text-sm text-muted">{t('quotesList.vacio')}</p>
  }

  return (
    <ul className="grid gap-4">
      {cotizaciones.map((c) => {
        const restoSugerido =
          c.monto_total != null ? Math.max(0, Number(c.monto_total) - Number(c.anticipo_monto || 0)) : ''

        return (
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
              {t('quotesList.eliminar')}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-4 text-sm text-parchment/90">
            <p><span className="text-muted">{t('quotesList.telefono')} </span>{c.telefono}</p>
            {c.email && <p><span className="text-muted">{t('quotesList.correo')} </span>{c.email}</p>}
            {c.tipo_mueble && <p><span className="text-muted">{t('quotesList.tipoMueble')} </span>{c.tipo_mueble}</p>}
            {c.presupuesto && <p><span className="text-muted">{t('quotesList.presupuesto')} </span>{c.presupuesto}</p>}
          </div>

          {c.descripcion && (
            <p className="text-sm text-parchment/80 mt-3 border-t border-line pt-3">{c.descripcion}</p>
          )}

          <div className="mt-4 border-t border-line pt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
              {t('quotesList.montoTotal')}
            </span>
            <input
              type="number"
              min="0"
              placeholder={t('quotesList.montoTotalPlaceholder')}
              value={montosTotales[c.id] ?? ''}
              onChange={(e) => setMontosTotales({ ...montosTotales, [c.id]: e.target.value })}
              className="bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors w-40"
            />
            <button
              onClick={() => handleGuardarMontoTotal(c.id)}
              disabled={guardandoTotalId === c.id}
              className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50"
            >
              {guardandoTotalId === c.id
                ? t('quotesList.generando')
                : exitoTotalId === c.id
                  ? t('inventoryManager.guardado')
                  : t('inventoryManager.guardar')}
            </button>
            {erroresTotal[c.id] && <p className="text-xs text-red-400 w-full">{erroresTotal[c.id]}</p>}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            {c.anticipo_estado === 'pagado' ? (
              <p className="font-mono text-xs uppercase tracking-widest text-brass">
                {t('quotesList.anticipoRecibido')} ${Number(c.anticipo_monto).toLocaleString('en-US')} USD
              </p>
            ) : (
              <PagoForm
                t={t}
                clave={`${c.id}::anticipo`}
                placeholder={t('quotesList.montoPlaceholder')}
                monto={montos[`${c.id}::anticipo`]}
                onMontoChange={(v) => setMontos({ ...montos, [`${c.id}::anticipo`]: v })}
                generando={generandoClave === `${c.id}::anticipo`}
                onGenerar={() => handleGenerarLink(c.id, 'anticipo')}
                link={linksGenerados[`${c.id}::anticipo`]}
                error={errores[`${c.id}::anticipo`]}
                onCopiar={copiarLink}
              />
            )}
          </div>

          {c.anticipo_estado === 'pagado' && (
            <div className="mt-4 border-t border-line pt-4">
              {c.resto_estado === 'pagado' ? (
                <p className="font-mono text-xs uppercase tracking-widest text-brass">
                  {t('quotesList.restoRecibido')} ${Number(c.resto_monto).toLocaleString('en-US')} USD
                </p>
              ) : (
                <PagoForm
                  t={t}
                  clave={`${c.id}::resto`}
                  placeholder={t('quotesList.montoRestoPlaceholder')}
                  monto={montos[`${c.id}::resto`] ?? restoSugerido}
                  onMontoChange={(v) => setMontos({ ...montos, [`${c.id}::resto`]: v })}
                  generando={generandoClave === `${c.id}::resto`}
                  onGenerar={() => handleGenerarLink(c.id, 'resto', restoSugerido)}
                  link={linksGenerados[`${c.id}::resto`]}
                  error={errores[`${c.id}::resto`]}
                  onCopiar={copiarLink}
                  generarLabel={t('quotesList.generarLinkResto')}
                />
              )}
            </div>
          )}
        </li>
        )
      })}
    </ul>
  )
}

function PagoForm({ t, placeholder, monto, onMontoChange, generando, onGenerar, link, error, onCopiar, generarLabel }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="number"
        min="1"
        placeholder={placeholder}
        value={monto ?? ''}
        onChange={(e) => onMontoChange(e.target.value)}
        className="bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors w-52"
      />
      <button
        onClick={onGenerar}
        disabled={generando}
        className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50"
      >
        {generando ? t('quotesList.generando') : generarLabel ?? t('quotesList.generarLink')}
      </button>

      {link && (
        <div className="flex items-center gap-2 w-full mt-1">
          <input
            readOnly
            value={link}
            className="flex-1 bg-surface2 border border-line rounded-sm px-3 py-2 text-xs text-parchment/80"
          />
          <button
            onClick={() => onCopiar(link)}
            className="font-mono text-xs uppercase tracking-widest text-brass hover:underline shrink-0"
          >
            {t('quotesList.copiar')}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400 w-full">{error}</p>}
    </div>
  )
}
