import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 grid sm:grid-cols-2 gap-12 items-center">
      <div>
        <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-4">
          {t('hero.kicker')}
        </p>
        <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] text-parchment">
          {t('hero.tituloL1')}
          <span className="text-walnut2"> {t('hero.tituloL2')}</span>
        </h1>
        <p className="mt-6 text-parchment/70 text-lg max-w-md">{t('hero.texto')}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/catalogo"
            className="bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
          >
            {t('hero.verCatalogo')}
          </Link>
          <Link
            to="/contacto"
            className="border border-line text-parchment font-body px-6 py-3 rounded-sm hover:border-brass hover:text-brass transition-colors"
          >
            {t('hero.pedirCotizacion')}
          </Link>
        </div>
      </div>

      <div className="relative">
        <svg viewBox="0 0 420 340" className="w-full h-auto" role="img" aria-label={t('hero.bocetoAlt')}>
          {/* silueta del sillón */}
          <path
            d="M90 250 V150 Q90 120 120 120 H260 Q290 120 290 150 V250 M90 250 H70 V270 H310 V250 H290 M90 210 H290"
            fill="none"
            stroke="#F0EBE1"
            strokeOpacity="0.85"
            strokeWidth="2"
          />
          {/* cojín */}
          <rect x="110" y="160" width="170" height="45" rx="6" fill="none" stroke="#A6673A" strokeWidth="1.5" />

          {/* líneas de acotación horizontal (ancho) */}
          <g className="blueprint-fade" style={{ strokeDasharray: 400 }}>
            <line x1="70" y1="300" x2="310" y2="300" stroke="#C9A227" strokeWidth="1" />
            <line x1="70" y1="295" x2="70" y2="305" stroke="#C9A227" strokeWidth="1" />
            <line x1="310" y1="295" x2="310" y2="305" stroke="#C9A227" strokeWidth="1" />
          </g>
          <text x="190" y="320" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="12" fill="#C9A227">
            90 cm
          </text>

          {/* línea de acotación vertical (alto) */}
          <g className="blueprint-fade" style={{ strokeDasharray: 400 }}>
            <line x1="335" y1="120" x2="335" y2="270" stroke="#C9A227" strokeWidth="1" />
            <line x1="330" y1="120" x2="340" y2="120" stroke="#C9A227" strokeWidth="1" />
            <line x1="330" y1="270" x2="340" y2="270" stroke="#C9A227" strokeWidth="1" />
          </g>
          <text x="352" y="200" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="12" fill="#C9A227" transform="rotate(90 352 200)">
            85 cm
          </text>

          {/* etiqueta de nota */}
          <text x="20" y="30" fontFamily="Space Mono, monospace" fontSize="11" fill="#9A9186">
            {t('hero.refSillon')}
          </text>
        </svg>
      </div>
    </section>
  )
}
