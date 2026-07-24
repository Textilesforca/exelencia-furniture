import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'

export default function ShippingManager() {
  const { t } = useLanguage()
  const [monto, setMonto] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  useEffect(() => {
    async function cargar() {
      const { data } = await supabase.from('configuracion_envio').select('monto_flete').single()
      if (data) setMonto(String(data.monto_flete))
      setCargando(false)
    }
    cargar()
  }, [])

  async function handleGuardar(e) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito(false)

    const { error } = await supabase
      .from('configuracion_envio')
      .update({ monto_flete: Number(monto) || 0 })
      .eq('id', true)

    if (error) {
      setError(error.message)
      setGuardando(false)
      return
    }

    setGuardando(false)
    setExito(true)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('shippingManager.cargando')}</p>
  }

  return (
    <div className="max-w-md">
      <h2 className="font-display text-2xl text-parchment mb-2">{t('shippingManager.titulo')}</h2>
      <p className="font-mono text-xs text-muted mb-6">{t('shippingManager.descripcion')}</p>

      <form onSubmit={handleGuardar} className="grid gap-5">
        <label className="block">
          <span className="font-mono text-[11px] tracking-widest text-muted uppercase">
            {t('shippingManager.montoFlete')}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-2 w-full bg-surface border border-line rounded-sm px-4 py-3 text-parchment focus:border-brass outline-none transition-colors"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {exito && <p className="text-sm text-brass">{t('shippingManager.guardadoExito')}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50 w-fit"
        >
          {guardando ? t('shippingManager.guardando') : t('shippingManager.guardar')}
        </button>
      </form>
    </div>
  )
}
