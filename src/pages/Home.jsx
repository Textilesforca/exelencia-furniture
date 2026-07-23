import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import Banner from '../components/Banner'
import BlueprintDivider from '../components/BlueprintDivider'
import ProductCard from '../components/ProductCard'
import { sampleProducts } from '../data/products'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const [destacados, setDestacados] = useState(sampleProducts.slice(0, 3))

  useEffect(() => {
    async function cargarDestacados() {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(3)
      if (!error && data && data.length > 0) setDestacados(data)
    }
    cargarDestacados()
  }, [])

  return (
    <>
      <Banner />
      <Hero />

      <section className="max-w-6xl mx-auto px-6 py-6">
        <BlueprintDivider label={t('home.destacadas')} />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid gap-4">
        {destacados.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-10">
        <Step numero="01" titulo={t('home.paso1Titulo')} texto={t('home.paso1Texto')} />
        <Step numero="02" titulo={t('home.paso2Titulo')} texto={t('home.paso2Texto')} />
        <Step numero="03" titulo={t('home.paso3Titulo')} texto={t('home.paso3Texto')} />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <p className="font-display text-3xl text-parchment mb-6">{t('home.ctaTitulo')}</p>
        <Link
          to="/contacto"
          className="inline-block bg-brass text-ink font-body font-medium px-8 py-3 rounded-sm hover:bg-walnut2 transition-colors"
        >
          {t('home.ctaBoton')}
        </Link>
      </section>
    </>
  )
}

function Step({ numero, titulo, texto }) {
  return (
    <div className="border-t border-line pt-4">
      <p className="font-mono text-xs text-brass">{numero}</p>
      <h3 className="font-display text-xl text-parchment mt-2">{titulo}</h3>
      <p className="text-sm text-muted mt-2">{texto}</p>
    </div>
  )
}
