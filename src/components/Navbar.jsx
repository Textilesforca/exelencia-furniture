import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function Navbar() {
  const { lang, setLang, t } = useLanguage()

  const links = [
    { to: '/', label: t('navbar.inicio') },
    { to: '/catalogo', label: t('navbar.catalogo') },
    { to: '/contacto', label: t('navbar.cotizar') },
  ]

  return (
    <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur border-b border-line">
      <nav className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="font-display text-lg tracking-tight leading-none">
          <span className="block text-parchment">Custom &amp; Designs</span>
          <span className="block text-[11px] font-mono tracking-[0.2em] text-brass uppercase mt-1">
            The Exelencia Furniture
          </span>
        </Link>
        <ul className="hidden sm:flex items-center gap-8 font-body text-sm">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `pb-1 border-b transition-colors ${
                    isActive ? 'text-brass border-brass' : 'text-parchment/80 border-transparent hover:text-brass'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            aria-label="Cambiar idioma / Change language"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-parchment/80 hover:text-brass transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9S9.5 5.6 12 3z" />
            </svg>
            {t('idioma.cambiarA')}
          </button>
          <Link
            to="/contacto"
            className="sm:hidden text-xs font-mono uppercase tracking-widest text-brass border border-brass/50 px-3 py-2 rounded-sm"
          >
            {t('navbar.cotizar')}
          </Link>
        </div>
      </nav>
    </header>
  )
}
