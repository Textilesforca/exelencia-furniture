import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { categorias } from '../../data/products'
import { useLanguage } from '../../i18n/LanguageContext'
import { traducirCategoria } from '../../i18n/translations'
import { sanitizarNombreArchivo } from '../../lib/sanitizarNombreArchivo'
import { eliminarArchivoStorage } from '../../lib/storage'

const categoriasForm = categorias.filter((c) => c !== 'Todos')

export default function CatalogoManager() {
  const { lang, t } = useLanguage()
  const [portadas, setPortadas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(null)
  const [error, setError] = useState('')

  async function cargarPortadas() {
    setCargando(true)
    const { data, error } = await supabase.from('categoria_portadas').select('*')
    if (!error) setPortadas(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargarPortadas()
  }, [])

  function portadaDe(categoria) {
    return portadas.find((p) => p.categoria === categoria)
  }

  async function handleSubirPortada(categoria, e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendo(categoria)
    setError('')

    try {
      const anterior = portadaDe(categoria)
      const ruta = `portadas/${Date.now()}-${sanitizarNombreArchivo(archivo.name)}`
      const { error: uploadError } = await supabase.storage.from('productos-imagenes').upload(ruta, archivo)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('productos-imagenes').getPublicUrl(ruta)

      const { error: upsertError } = await supabase
        .from('categoria_portadas')
        .upsert({ categoria, imagen: publicUrlData.publicUrl }, { onConflict: 'categoria' })
      if (upsertError) throw upsertError

      if (anterior) await eliminarArchivoStorage(anterior.imagen)
      cargarPortadas()
    } catch (err) {
      setError(t('catalogoManager.errorSubir') + ': ' + err.message)
    }

    setSubiendo(null)
    e.target.value = ''
  }

  async function handleQuitarPortada(categoria) {
    if (!window.confirm(t('catalogoManager.confirmarQuitar'))) return
    const anterior = portadaDe(categoria)
    if (!anterior) return
    await supabase.from('categoria_portadas').delete().eq('id', anterior.id)
    await eliminarArchivoStorage(anterior.imagen)
    cargarPortadas()
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('catalogoManager.cargando')}</p>
  }

  return (
    <div>
      <p className="text-sm text-muted mb-6">{t('catalogoManager.descripcion')}</p>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-2 gap-6">
        {categoriasForm.map((categoria) => {
          const portada = portadaDe(categoria)
          return (
            <div key={categoria} className="bg-surface border border-line rounded-sm p-4">
              <p className="font-mono text-xs tracking-widest text-brass uppercase mb-3">
                {traducirCategoria(categoria, lang)}
              </p>

              {portada ? (
                <div className="relative w-fit mb-3">
                  <img
                    src={portada.imagen}
                    alt=""
                    className="w-full max-w-xs aspect-[4/5] object-cover rounded-sm border border-line"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuitarPortada(categoria)}
                    className="absolute -top-2 -right-2 bg-ink border border-line rounded-full w-6 h-6 text-xs text-red-400 leading-none"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="font-mono text-xs text-muted mb-3">{t('catalogoManager.sinPortada')}</p>
              )}

              <label className="inline-block">
                <span className="sr-only">{t('catalogoManager.subirPortada')}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={subiendo === categoria}
                  onChange={(e) => handleSubirPortada(categoria, e)}
                  className="text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium disabled:opacity-50"
                />
              </label>
              {subiendo === categoria && (
                <p className="font-mono text-xs text-muted mt-2">{t('catalogoManager.subiendo')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
