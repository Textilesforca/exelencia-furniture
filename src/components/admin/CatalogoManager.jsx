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
  const [imagenes, setImagenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendoPortada, setSubiendoPortada] = useState(null)
  const [subiendoGaleria, setSubiendoGaleria] = useState(null)
  const [error, setError] = useState('')

  async function cargarTodo() {
    setCargando(true)
    const [{ data: dataPortadas }, { data: dataImagenes }] = await Promise.all([
      supabase.from('categoria_portadas').select('*'),
      supabase.from('categoria_imagenes').select('*').order('orden', { ascending: true }),
    ])
    setPortadas(dataPortadas ?? [])
    setImagenes(dataImagenes ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargarTodo()
  }, [])

  function portadaDe(categoria) {
    return portadas.find((p) => p.categoria === categoria)
  }

  function imagenesDe(categoria) {
    return imagenes.filter((i) => i.categoria === categoria)
  }

  async function subirArchivo(carpeta, archivo) {
    const ruta = `${carpeta}/${Date.now()}-${sanitizarNombreArchivo(archivo.name)}`
    const { error: uploadError } = await supabase.storage.from('productos-imagenes').upload(ruta, archivo)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('productos-imagenes').getPublicUrl(ruta)
    return data.publicUrl
  }

  async function handleSubirPortada(categoria, e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendoPortada(categoria)
    setError('')

    try {
      const anterior = portadaDe(categoria)
      const url = await subirArchivo('portadas', archivo)

      const { error: upsertError } = await supabase
        .from('categoria_portadas')
        .upsert({ categoria, imagen: url }, { onConflict: 'categoria' })
      if (upsertError) throw upsertError

      if (anterior) await eliminarArchivoStorage(anterior.imagen)
      cargarTodo()
    } catch (err) {
      setError(t('catalogoManager.errorSubir') + ': ' + err.message)
    }

    setSubiendoPortada(null)
    e.target.value = ''
  }

  async function handleQuitarPortada(categoria) {
    if (!window.confirm(t('catalogoManager.confirmarQuitar'))) return
    const anterior = portadaDe(categoria)
    if (!anterior) return
    await supabase.from('categoria_portadas').delete().eq('id', anterior.id)
    await eliminarArchivoStorage(anterior.imagen)
    cargarTodo()
  }

  async function handleAgregarGaleria(categoria, e) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    setSubiendoGaleria(categoria)
    setError('')

    try {
      let orden = imagenesDe(categoria).length
      for (const archivo of archivos) {
        const url = await subirArchivo('catalogo', archivo)
        const { error: insertError } = await supabase
          .from('categoria_imagenes')
          .insert({ categoria, imagen: url, orden })
        if (insertError) throw insertError
        orden += 1
      }
      cargarTodo()
    } catch (err) {
      setError(t('catalogoManager.errorSubir') + ': ' + err.message)
    }

    setSubiendoGaleria(null)
    e.target.value = ''
  }

  async function handleQuitarImagenGaleria(id) {
    if (!window.confirm(t('catalogoManager.confirmarQuitar'))) return
    const imagen = imagenes.find((i) => i.id === id)
    if (!imagen) return
    await supabase.from('categoria_imagenes').delete().eq('id', id)
    await eliminarArchivoStorage(imagen.imagen)
    cargarTodo()
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('catalogoManager.cargando')}</p>
  }

  return (
    <div>
      <p className="text-sm text-muted mb-6">{t('catalogoManager.descripcion')}</p>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="grid gap-8">
        {categoriasForm.map((categoria) => {
          const portada = portadaDe(categoria)
          const galeria = imagenesDe(categoria)
          return (
            <div key={categoria} className="bg-surface border border-line rounded-sm p-5">
              <p className="font-mono text-xs tracking-widest text-brass uppercase mb-4">
                {traducirCategoria(categoria, lang)}
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="font-mono text-[11px] tracking-widest text-muted uppercase mb-2">
                    {t('catalogoManager.portada')}
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
                      disabled={subiendoPortada === categoria}
                      onChange={(e) => handleSubirPortada(categoria, e)}
                      className="text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium disabled:opacity-50"
                    />
                  </label>
                  {subiendoPortada === categoria && (
                    <p className="font-mono text-xs text-muted mt-2">{t('catalogoManager.subiendo')}</p>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[11px] tracking-widest text-muted uppercase mb-2">
                    {t('catalogoManager.galeria')}
                  </p>

                  {galeria.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {galeria.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={img.imagen}
                            alt=""
                            className="w-20 h-20 object-cover rounded-sm border border-line"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuitarImagenGaleria(img.id)}
                            className="absolute -top-2 -right-2 bg-ink border border-line rounded-full w-5 h-5 text-xs text-red-400 leading-none"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-mono text-xs text-muted mb-3">{t('catalogoManager.sinGaleria')}</p>
                  )}

                  <label className="inline-block">
                    <span className="sr-only">{t('catalogoManager.agregarGaleria')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={subiendoGaleria === categoria}
                      onChange={(e) => handleAgregarGaleria(categoria, e)}
                      className="text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium disabled:opacity-50"
                    />
                  </label>
                  {subiendoGaleria === categoria && (
                    <p className="font-mono text-xs text-muted mt-2">{t('catalogoManager.subiendo')}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
