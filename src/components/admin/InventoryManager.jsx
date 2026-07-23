import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { categorias } from '../../data/products'
import { useLanguage } from '../../i18n/LanguageContext'
import { traducirCategoria } from '../../i18n/translations'

export default function InventoryManager() {
  const { lang, t } = useLanguage()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [valores, setValores] = useState({})
  const [guardandoClave, setGuardandoClave] = useState(null)
  const [errores, setErrores] = useState({})
  const [exitoClave, setExitoClave] = useState(null)
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')

  const categoriasPresentes = useMemo(
    () => categorias.filter((c) => c === 'Todos' || productos.some((p) => p.categoria === c)),
    [productos]
  )

  const productosFiltrados =
    categoriaActiva === 'Todos' ? productos : productos.filter((p) => p.categoria === categoriaActiva)

  async function cargarProductos() {
    setCargando(true)
    const { data, error } = await supabase.from('productos').select('*').order('nombre', { ascending: true })
    if (!error) {
      setProductos(data ?? [])
      const iniciales = {}
      for (const p of data ?? []) {
        if (p.colores?.length > 0) {
          for (const c of p.colores) {
            iniciales[`${p.id}::${c.nombre}`] = c.stock ?? 0
          }
        } else {
          iniciales[p.id] = p.stock ?? 0
        }
      }
      setValores(iniciales)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  async function handleGuardarSinColor(id) {
    const nuevoStock = Math.max(0, Math.round(Number(valores[id]) || 0))
    setGuardandoClave(id)
    setErrores({ ...errores, [id]: '' })
    setExitoClave(null)

    const { error } = await supabase.rpc('actualizar_stock', { p_producto_id: id, p_stock: nuevoStock })

    if (error) {
      setErrores({ ...errores, [id]: error.message })
      setGuardandoClave(null)
      return
    }

    setProductos(productos.map((p) => (p.id === id ? { ...p, stock: nuevoStock } : p)))
    setGuardandoClave(null)
    setExitoClave(id)
    setTimeout(() => setExitoClave(null), 2000)
  }

  async function handleGuardarColor(producto, colorNombre) {
    const clave = `${producto.id}::${colorNombre}`
    const nuevoStock = Math.max(0, Math.round(Number(valores[clave]) || 0))
    setGuardandoClave(clave)
    setErrores({ ...errores, [clave]: '' })
    setExitoClave(null)

    const { error } = await supabase.rpc('actualizar_stock_color', {
      p_producto_id: producto.id,
      p_color_nombre: colorNombre,
      p_stock: nuevoStock,
    })

    if (error) {
      setErrores({ ...errores, [clave]: error.message })
      setGuardandoClave(null)
      return
    }

    setProductos(
      productos.map((p) =>
        p.id === producto.id
          ? { ...p, colores: p.colores.map((c) => (c.nombre === colorNombre ? { ...c, stock: nuevoStock } : c)) }
          : p
      )
    )
    setGuardandoClave(null)
    setExitoClave(clave)
    setTimeout(() => setExitoClave(null), 2000)
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

      <div className="flex flex-wrap gap-2 mb-6">
        {categoriasPresentes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategoriaActiva(c)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-sm border transition-colors ${
              categoriaActiva === c
                ? 'border-brass text-brass'
                : 'border-line text-muted hover:text-parchment hover:border-brass/60'
            }`}
          >
            {traducirCategoria(c, lang)}
          </button>
        ))}
      </div>

      {productosFiltrados.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('inventoryManager.vacio')}</p>
      ) : (
      <ul className="grid gap-3">
        {productosFiltrados.map((p) => {
          const tieneColores = p.colores?.length > 0
          const stockTotal = tieneColores
            ? p.colores.reduce((suma, c) => suma + Number(c.stock ?? 0), 0)
            : Number(p.stock ?? 0)

          return (
            <li key={p.id} className="bg-surface border border-line rounded-sm p-3">
              <div className="flex items-center gap-4">
                <img src={p.imagen} alt={p.nombre} className="h-16 w-16 object-cover rounded-sm bg-surface2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-parchment truncate">{p.nombre}</p>
                  <p className="font-mono text-xs text-muted">{traducirCategoria(p.categoria, lang)}</p>
                  {stockTotal <= 0 ? (
                    <p className="font-mono text-[11px] uppercase tracking-widest text-red-400 mt-1">
                      {t('inventoryManager.sinExistencias')}
                    </p>
                  ) : stockTotal < 5 ? (
                    <p className="font-mono text-[11px] uppercase tracking-widest text-brass mt-1">
                      {t('inventoryManager.bajoStock')}
                    </p>
                  ) : null}
                </div>

                {!tieneColores && (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={valores[p.id] ?? 0}
                      onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })}
                      className="w-24 bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment focus:border-brass outline-none transition-colors shrink-0"
                    />
                    <button
                      onClick={() => handleGuardarSinColor(p.id)}
                      disabled={guardandoClave === p.id}
                      className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50 shrink-0"
                    >
                      {guardandoClave === p.id
                        ? t('inventoryManager.guardando')
                        : exitoClave === p.id
                          ? t('inventoryManager.guardado')
                          : t('inventoryManager.guardar')}
                    </button>
                  </>
                )}
              </div>

              {errores[p.id] && <p className="text-xs text-red-400 mt-2">{errores[p.id]}</p>}

              {tieneColores && (
                <ul className="mt-3 grid gap-2 pl-20">
                  {p.colores.map((c) => {
                    const clave = `${p.id}::${c.nombre}`
                    return (
                      <li key={c.nombre} className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full border border-line shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-sm text-parchment/90 flex-1 min-w-0 truncate">{c.nombre}</span>
                        <input
                          type="number"
                          min="0"
                          value={valores[clave] ?? 0}
                          onChange={(e) => setValores({ ...valores, [clave]: e.target.value })}
                          className="w-24 bg-surface2 border border-line rounded-sm px-3 py-2 text-sm text-parchment focus:border-brass outline-none transition-colors shrink-0"
                        />
                        <button
                          onClick={() => handleGuardarColor(p, c.nombre)}
                          disabled={guardandoClave === clave}
                          className="font-mono text-xs uppercase tracking-widest text-brass hover:underline disabled:opacity-50 shrink-0"
                        >
                          {guardandoClave === clave
                            ? t('inventoryManager.guardando')
                            : exitoClave === clave
                              ? t('inventoryManager.guardado')
                              : t('inventoryManager.guardar')}
                        </button>
                        {errores[clave] && <p className="text-xs text-red-400">{errores[clave]}</p>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      )}
    </div>
  )
}
