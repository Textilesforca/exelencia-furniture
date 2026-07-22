import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'
import { sanitizarNombreArchivo } from '../../lib/sanitizarNombreArchivo'

export default function BannerManager() {
  const { t } = useLanguage()
  const [banners, setBanners] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendoInicio, setSubiendoInicio] = useState(false)
  const [subiendoCatalogo, setSubiendoCatalogo] = useState(false)
  const [error, setError] = useState('')

  async function cargarBanners() {
    setCargando(true)
    const { data, error } = await supabase.from('banners').select('*').order('orden', { ascending: true })
    if (!error) setBanners(data ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargarBanners()
  }, [])

  const bannersInicio = banners.filter((b) => b.tipo === 'inicio')
  const bannerCatalogo = banners.find((b) => b.tipo === 'catalogo')

  async function subirArchivo(archivo) {
    const ruta = `banners/${Date.now()}-${sanitizarNombreArchivo(archivo.name)}`
    const { error: uploadError } = await supabase.storage.from('productos-imagenes').upload(ruta, archivo)
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('productos-imagenes').getPublicUrl(ruta)
    return data.publicUrl
  }

  async function handleAgregarInicio(e) {
    const archivos = Array.from(e.target.files ?? [])
    if (archivos.length === 0) return
    setSubiendoInicio(true)
    setError('')

    try {
      let orden = bannersInicio.length
      for (const archivo of archivos) {
        const url = await subirArchivo(archivo)
        const { error: insertError } = await supabase
          .from('banners')
          .insert({ tipo: 'inicio', imagen: url, orden })
        if (insertError) throw insertError
        orden += 1
      }
      cargarBanners()
    } catch (err) {
      setError(t('bannerManager.errorSubir') + ': ' + err.message)
    }

    setSubiendoInicio(false)
    e.target.value = ''
  }

  async function handleQuitarInicio(id) {
    if (!window.confirm(t('bannerManager.confirmarQuitar'))) return
    await supabase.from('banners').delete().eq('id', id)
    cargarBanners()
  }

  async function handleCambiarCatalogo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setSubiendoCatalogo(true)
    setError('')

    try {
      const url = await subirArchivo(archivo)
      if (bannerCatalogo) {
        await supabase.from('banners').delete().eq('id', bannerCatalogo.id)
      }
      const { error: insertError } = await supabase
        .from('banners')
        .insert({ tipo: 'catalogo', imagen: url, orden: 0 })
      if (insertError) throw insertError
      cargarBanners()
    } catch (err) {
      setError(t('bannerManager.errorSubir') + ': ' + err.message)
    }

    setSubiendoCatalogo(false)
    e.target.value = ''
  }

  async function handleQuitarCatalogo() {
    if (!bannerCatalogo) return
    if (!window.confirm(t('bannerManager.confirmarQuitar'))) return
    await supabase.from('banners').delete().eq('id', bannerCatalogo.id)
    cargarBanners()
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('bannerManager.cargando')}</p>
  }

  return (
    <div className="grid gap-12">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <h2 className="font-display text-2xl text-parchment mb-2">{t('bannerManager.tituloInicio')}</h2>
        <p className="text-sm text-muted mb-5">{t('bannerManager.descripcionInicio')}</p>

        {bannersInicio.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-5">
            {bannersInicio.map((b) => (
              <div key={b.id} className="relative">
                <img src={b.imagen} alt="" className="w-32 h-24 object-cover rounded-sm border border-line" />
                <button
                  type="button"
                  onClick={() => handleQuitarInicio(b.id)}
                  className="absolute -top-2 -right-2 bg-ink border border-line rounded-full w-6 h-6 text-xs text-red-400 leading-none"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="inline-block">
          <span className="sr-only">{t('bannerManager.agregarImagenes')}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={subiendoInicio}
            onChange={handleAgregarInicio}
            className="text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium disabled:opacity-50"
          />
        </label>
        {subiendoInicio && <p className="font-mono text-xs text-muted mt-2">{t('bannerManager.subiendo')}</p>}
      </div>

      <div>
        <h2 className="font-display text-2xl text-parchment mb-2">{t('bannerManager.tituloCatalogo')}</h2>
        <p className="text-sm text-muted mb-5">{t('bannerManager.descripcionCatalogo')}</p>

        {bannerCatalogo && (
          <div className="relative w-fit mb-5">
            <img src={bannerCatalogo.imagen} alt="" className="w-64 h-36 object-cover rounded-sm border border-line" />
            <button
              type="button"
              onClick={handleQuitarCatalogo}
              className="absolute -top-2 -right-2 bg-ink border border-line rounded-full w-6 h-6 text-xs text-red-400 leading-none"
            >
              ✕
            </button>
          </div>
        )}

        <label className="inline-block">
          <span className="sr-only">{t('bannerManager.cambiarImagen')}</span>
          <input
            type="file"
            accept="image/*"
            disabled={subiendoCatalogo}
            onChange={handleCambiarCatalogo}
            className="text-sm text-parchment file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-brass file:text-ink file:font-medium disabled:opacity-50"
          />
        </label>
        {subiendoCatalogo && <p className="font-mono text-xs text-muted mt-2">{t('bannerManager.subiendo')}</p>}
      </div>
    </div>
  )
}
