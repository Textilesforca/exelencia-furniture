import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'
import { traducirCategoria } from '../../i18n/translations'

export default function InventoryManager() {
  const { lang, t } = useLanguage()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [valores, setValores] = useState({})
  const [guardandoId, setGuardandoId] = useState(null)
  const [errores, setErrores] = useState({})
  const [exitoId, setExitoId] = useState(null)

  async function cargarProductos() {
    setCargando(true)
    const { data, error } = await supabase.from('productos').select('*').order('nombre', { ascending: true })
    if (!error) {
      setProductos(data ?? [])
      setValores(Object.fromEntries((data ?? []).map((p) => [p.id, p.stock ?? 0])))
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  async function handleGuardar(id) {
    const nuevoStock = Math.max(0, Math.round(Number(valores[id]) || 0))
    setGuardandoId(id)
    setErrores({ ...errores, [id]: '' })
    setExitoId(null)

    const { error } = await supabase.rpc('actualizar_stock', { p_producto_id: id, p_stock: nuevoStock })

    if (error) {
      setErrores({ ...errores, [id]: error.message })
      setGuardandoId(null)
      return
    }

    setProductos(productos.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p)))
    setGuardandoId(null)
    setExitoId(id)
    setTimeout(() => setExitoId(null), 2000)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('inventoryManager.cargando')}</p>
  }

  if (productos.length === 0) {
    return <p className="font-mono text-sm text-muted">{t('inventoryManager.vacio')}</p>
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-parchment mb-6">{t('inventoryManager.titulo')}</h2>
      <ul className="grid gap-3">
        {productos.map((p) => {
          const stockActual = Number(p.stock ?? 0)
          return (
            <li
              key={p.id}
              className="flex items-center gap-4 bg-surface border border-line rounded-sm p-3"
            >
              <img src={p.imagen} alt={p.nombre} className="h-16 w-16 object-cover rounded-sm bg-surface2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-parchment truncate">{p.nombre}</p>
                <p className="font-mono text-xs text-muted">{traducirCategoria(p.categoria, lang)}</p>
                {stockActual <= 0 ? (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-red-400 mt-1">
                    {t('inventoryManager.sinExistencias')}
                  </p>
                ) : stockActual < 5 ? (
                  <p className="font-mono text-[11px] uppercase tracking-widest text-brass mt-1">
                    {t('inventoryManager.bajoStock')}
                  </p>
                ) : null}
                {errores[p.id] && <p className="text-xs text-red-400 mt-1">{errores[p.id]}</p>}
              </div>

              <input
                type="number"
                min="0"
                value={valores[p.id] ?? 0}
                onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })}
                className="w-24 bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment focus:border-brass outline-none transition-colors shrink-0"
              />

              <button
                onClick={() => handleGuardar(p.id)}
                disabled={guardandoId === p.id}
                className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50 shrink-0"
              >
                {guardandoId === p.id
                  ? t('inventoryManager.guardando')
                  : exitoId === p.id
                    ? t('inventoryManager.guardado')
                    : t('inventoryManager.guardar')}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
