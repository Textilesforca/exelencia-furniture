import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Banner() {
  const { t } = useLanguage()

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <div className="relative overflow-hidden rounded-sm border border-brass/40 bg-gradient-to-r from-surface via-surface2 to-surface px-8 py-10 sm:px-14 sm:py-14 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase mb-4">{t('banner.kicker')}</p>
        <h2 className="font-display text-3xl sm:text-4xl text-parchment mb-4">{t('banner.titulo')}</h2>
        <p className="text-parchment/70 max-w-lg mx-auto mb-8">{t('banner.texto')}</p>
        <Link
          to="/contacto"
          className="inline-block bg-brass text-ink font-body font-medium px-8 py-3 rounded-sm hover:bg-walnut2 transition-colors"
        >
          {t('banner.boton')}
        </Link>
      </div>
    </section>
  )
}
