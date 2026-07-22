import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import CatalogViewer from '../components/CatalogViewer'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria } from '../i18n/translations'

export default function CatalogoGaleria() {
  const { categoria } = useParams()
  const { lang, t } = useLanguage()
  const [imagenes, setImagenes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarGaleria() {
      setCargando(true)
      const { data } = await supabase
        .from('categoria_imagenes')
        .select('*')
        .eq('categoria', categoria)
        .order('orden', { ascending: true })
      setImagenes(data ?? [])
      setCargando(false)
    }
    cargarGaleria()
  }, [categoria])

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-6">
        {traducirCategoria(categoria, lang)}
      </p>

      {cargando ? (
        <p className="font-mono text-sm text-muted">{t('catalog.cargando')}</p>
      ) : imagenes.length > 0 ? (
        <CatalogViewer imagenes={imagenes} categoria={categoria} />
      ) : (
        <p className="font-mono text-sm text-muted">{t('catalog.sinFotos')}</p>
      )}
    </section>
  )
}
