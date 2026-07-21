import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria } from '../i18n/translations'
import { categorias } from '../data/products'

const categoriasNav = categorias.filter((c) => c !== 'Todos')

export default function Navbar() {
  const { lang, setLang, t } = useLanguage()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  const links = [
    { to: '/', label: t('navbar.inicio') },
    { to: '/catalogo', label: t('navbar.catalogo') },
    { to: '/contacto', label: t('navbar.cotizar') },
  ]

  function handleBuscar(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (busqueda.trim()) params.set('buscar', busqueda.trim())
    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur border-b border-line">
      <nav className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link to="/" className="font-display text-lg tracking-tight leading-none shrink-0">
          <span className="block text-parchment">Custom &amp; Designs</span>
          <span className="block text-[11px] font-mono tracking-[0.2em] text-brass uppercase mt-1">
            The Exelencia Furniture
          </span>
        </Link>

        <form onSubmit={handleBuscar} className="hidden sm:flex flex-1 max-w-sm">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t('navbar.buscarPlaceholder')}
            className="w-full bg-surface border border-line rounded-sm px-4 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
          />
        </form>

        <ul className="hidden lg:flex items-center gap-8 font-body text-sm shrink-0">
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

        <div className="flex items-center gap-3 shrink-0">
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

          <span aria-label={t('navbar.carritoAria')} className="text-parchment/50">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
              <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3h2l2.2 11.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6" />
            </svg>
          </span>

          <Link
            to="/contacto"
            className="sm:hidden text-xs font-mono uppercase tracking-widest text-brass border border-brass/50 px-3 py-2 rounded-sm"
          >
            {t('navbar.cotizar')}
          </Link>
        </div>
      </nav>

      <div className="border-t border-line/60">
        <ul className="max-w-6xl mx-auto px-6 h-12 flex items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-widest text-parchment/70">
          {categoriasNav.map((cat) => (
            <li key={cat} className="shrink-0">
              <Link
                to={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                className="hover:text-brass transition-colors"
              >
                {traducirCategoria(cat, lang)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
