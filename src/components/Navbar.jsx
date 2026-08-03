import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria, traducirSubcategoria } from '../i18n/translations'
import { categorias, subcategoriasPorCategoria } from '../data/products'
import { useCart } from '../cart/CartContext'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabaseClient'

const categoriasNav = categorias.filter((c) => c !== 'Todos')

function stockDeProducto(producto) {
  if (producto.colores?.length > 0) {
    return producto.colores.reduce((suma, c) => suma + Number(c.stock ?? 0), 0)
  }
  return Number(producto.stock ?? 0)
}

export default function Navbar() {
  const { lang, setLang, t } = useLanguage()
  const { total } = useCart()
  const { session } = useSession()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [categoriaAbierta, setCategoriaAbierta] = useState(null)
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [categoriaMovilAbierta, setCategoriaMovilAbierta] = useState(null)
  const buscadorRef = useRef(null)
  const buscadorMovilRef = useRef(null)

  const links = [
    { to: '/', label: t('navbar.inicio') },
    { to: '/catalogo', label: t('navbar.catalogo') },
    { to: '/contacto', label: t('navbar.cotizar') },
  ]

  function handleBuscar(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (busqueda.trim()) params.set('buscar', busqueda.trim())
    setMostrarResultados(false)
    setMenuAbierto(false)
    navigate(`/catalogo${params.toString() ? `?${params.toString()}` : ''}`)
  }

  useEffect(() => {
    const texto = busqueda.trim()
    if (texto.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }

    setBuscando(true)
    const temporizador = setTimeout(async () => {
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, categoria, imagen, precio_desde, stock, colores')
        .or(`nombre.ilike.%${texto}%,descripcion.ilike.%${texto}%`)
        .limit(20)

      const conExistencias = (data ?? []).filter((p) => stockDeProducto(p) > 0).slice(0, 6)
      setResultados(conExistencias)
      setBuscando(false)
    }, 300)

    return () => clearTimeout(temporizador)
  }, [busqueda])

  useEffect(() => {
    function handleClickFuera(e) {
      const dentroDesktop = buscadorRef.current?.contains(e.target)
      const dentroMovil = buscadorMovilRef.current?.contains(e.target)
      if (!dentroDesktop && !dentroMovil) {
        setMostrarResultados(false)
      }
    }
    document.addEventListener('mousedown', handleClickFuera)
    return () => document.removeEventListener('mousedown', handleClickFuera)
  }, [])

  useEffect(() => {
    setMenuAbierto(false)
  }, [session])

  function handleSeleccionarResultado(id) {
    setMostrarResultados(false)
    setMenuAbierto(false)
    setBusqueda('')
    navigate(`/catalogo/${id}`)
  }

  function cerrarMenuMovil() {
    setMenuAbierto(false)
    setCategoriaMovilAbierta(null)
  }

  const subcategoriasActivas = categoriaAbierta ? subcategoriasPorCategoria[categoriaAbierta] : null

  function ResultadosBusqueda() {
    if (!(mostrarResultados && busqueda.trim().length >= 2 && (buscando || resultados.length > 0))) return null
    return (
      <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-brass/40 rounded-sm shadow-lg z-50 max-h-96 overflow-y-auto">
        {buscando ? (
          <p className="font-mono text-xs text-muted px-4 py-3">{t('navbar.buscando')}</p>
        ) : (
          <ul>
            {resultados.map((p) => (
              <li key={p.id} className="border-b border-line/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => handleSeleccionarResultado(p.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface2 transition-colors"
                >
                  <img src={p.imagen} alt="" className="w-11 h-11 object-cover rounded-sm bg-surface2 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-parchment truncate">{p.nombre}</span>
                    <span className="block font-mono text-[11px] text-muted uppercase tracking-widest">
                      {traducirCategoria(p.categoria, lang)}
                    </span>
                  </span>
                  <span className="font-mono text-sm text-walnut2 shrink-0">
                    ${Number(p.precio_desde).toLocaleString('en-US')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <header className="relative sticky top-0 z-40 bg-ink/90 backdrop-blur border-b border-line">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3 sm:gap-6">
        <Link to="/" className="flex items-center gap-3 font-display text-lg tracking-tight leading-none shrink-0">
          <img src="/logo.png" alt="Exelencia Furniture" className="w-11 h-11 rounded-full shrink-0" />
          <span className="hidden sm:inline">
            <span className="block text-parchment">Custom &amp; Designs</span>
            <span className="block text-[11px] font-mono tracking-[0.2em] text-brass uppercase mt-1">
              The Exelencia Furniture
            </span>
          </span>
        </Link>

        <div ref={buscadorRef} className="relative hidden sm:block flex-1 max-w-sm">
          <form onSubmit={handleBuscar} className="flex">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => setMostrarResultados(true)}
              placeholder={t('navbar.buscarPlaceholder')}
              className="w-full bg-surface border border-line rounded-sm px-4 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
            />
          </form>
          <ResultadosBusqueda />
        </div>

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

        <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
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
            <span>{t('idioma.cambiarA')}</span>
          </button>

          <Link
            to="/admin"
            aria-label={session ? t('navbar.panelAdmin') : t('navbar.iniciarSesion')}
            title={session ? t('navbar.panelAdmin') : t('navbar.iniciarSesion')}
            className="text-parchment/80 hover:text-brass transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
              <circle cx="12" cy="8" r="3.5" />
              <path strokeLinecap="round" d="M4.5 20c1.2-3.8 4.4-6 7.5-6s6.3 2.2 7.5 6" />
            </svg>
          </Link>

          <Link to="/carrito" aria-label={t('navbar.carritoAria')} className="relative text-parchment/80 hover:text-brass transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
              <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3h2l2.2 11.2a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6" />
            </svg>
            {total > 0 && (
              <span className="absolute -top-2 -right-2 bg-brass text-ink text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
                {total}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? t('navbar.cerrarMenu') : t('navbar.abrirMenu')}
            aria-expanded={menuAbierto}
            className="lg:hidden text-parchment/80 hover:text-brass transition-colors"
          >
            {menuAbierto ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <div className="sm:hidden border-t border-line/60 px-4 py-3 relative" ref={buscadorMovilRef}>
        <form onSubmit={handleBuscar} className="flex">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setMostrarResultados(true)}
            placeholder={t('navbar.buscarPlaceholder')}
            className="w-full bg-surface border border-line rounded-sm px-4 py-2 text-sm text-parchment placeholder:text-muted focus:border-brass outline-none transition-colors"
          />
        </form>
        <ResultadosBusqueda />
      </div>

      <div className="border-t border-line/60">
        <div className="relative max-w-6xl mx-auto px-6 flex items-center gap-6">
          <ul className="h-12 flex items-center gap-6 overflow-x-auto font-mono text-xs uppercase tracking-widest text-parchment/70 min-w-0">
            {categoriasNav.map((cat) =>
              subcategoriasPorCategoria[cat] ? (
                <li
                  key={cat}
                  className="h-full flex items-center shrink-0"
                  onMouseEnter={() => setCategoriaAbierta(cat)}
                  onMouseLeave={() => setCategoriaAbierta(null)}
                >
                  <Link
                    to={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    className="hover:text-brass transition-colors"
                  >
                    {traducirCategoria(cat, lang)}
                  </Link>
                </li>
              ) : (
                <li key={cat} className="shrink-0">
                  <Link
                    to={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                    className="hover:text-brass transition-colors"
                  >
                    {traducirCategoria(cat, lang)}
                  </Link>
                </li>
              )
            )}
            <li className="shrink-0">
              <Link to="/entrega" className="hover:text-brass transition-colors">
                {t('navbar.delivery')}
              </Link>
            </li>
            <li className="shrink-0">
              <Link to="/contacto" className="hover:text-brass transition-colors">
                {t('navbar.contactUs')}
              </Link>
            </li>
            {session && (
              <li className="shrink-0">
                <Link to="/admin" className="text-brass hover:text-parchment transition-colors">
                  {t('navbar.admin')}
                </Link>
              </li>
            )}
          </ul>

          <div className="hidden sm:flex items-center gap-4 shrink-0 ml-auto">
            <a
              href="https://facebook.com/exelenciafurniture"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-parchment/70 hover:text-brass transition-colors"
            >
              <IconoFacebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/exelenciafurniture"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-parchment/70 hover:text-brass transition-colors"
            >
              <IconoInstagram className="w-4 h-4" />
            </a>
            <a
              href="https://tiktok.com/@exelenciafurniture"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-parchment/70 hover:text-brass transition-colors"
            >
              <IconoTikTok className="w-4 h-4" />
            </a>
          </div>

          {subcategoriasActivas && (
            <div
              onMouseEnter={() => setCategoriaAbierta(categoriaAbierta)}
              onMouseLeave={() => setCategoriaAbierta(null)}
              className="absolute left-0 top-full pt-1 z-50"
            >
              <div
                className={`bg-surface border border-brass/40 rounded-sm shadow-lg px-5 py-4 grid gap-x-6 gap-y-1 ${
                  subcategoriasActivas.length > 12 ? 'grid-cols-3 w-[520px]' : 'grid-cols-2 w-[360px]'
                }`}
              >
                {subcategoriasActivas.map((sub) => (
                  <Link
                    key={sub}
                    to={
                      sub === subcategoriasActivas[0]
                        ? `/catalogo?categoria=${encodeURIComponent(categoriaAbierta)}`
                        : `/catalogo?categoria=${encodeURIComponent(categoriaAbierta)}&subcategoria=${encodeURIComponent(sub)}`
                    }
                    onClick={() => setCategoriaAbierta(null)}
                    className="font-body normal-case tracking-normal text-xs text-parchment/80 hover:text-brass transition-colors py-1"
                  >
                    {traducirSubcategoria(sub, lang, categoriaAbierta)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {menuAbierto && (
        <div className="lg:hidden border-t border-line/60 bg-ink max-h-[75vh] overflow-y-auto">
          <ul className="font-body text-sm">
            {links.map((l) => (
              <li key={l.to} className="border-b border-line/60">
                <Link
                  to={l.to}
                  onClick={cerrarMenuMovil}
                  className="block px-4 py-3 text-parchment hover:text-brass transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}

            {categoriasNav.map((cat) => {
              const subs = subcategoriasPorCategoria[cat]
              const abierta = categoriaMovilAbierta === cat
              return (
                <li key={cat} className="border-b border-line/60">
                  {subs ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setCategoriaMovilAbierta(abierta ? null : cat)}
                        aria-expanded={abierta}
                        className="w-full flex items-center justify-between px-4 py-3 text-parchment hover:text-brass transition-colors font-mono text-xs uppercase tracking-widest"
                      >
                        {traducirCategoria(cat, lang)}
                        <span className="text-brass">{abierta ? '−' : '+'}</span>
                      </button>
                      {abierta && (
                        <ul className="pb-2">
                          <li>
                            <Link
                              to={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                              onClick={cerrarMenuMovil}
                              className="block pl-8 pr-4 py-2 text-sm text-brass hover:underline"
                            >
                              {traducirCategoria(cat, lang)} — {t('catalog.verCatalogo')}
                            </Link>
                          </li>
                          {subs.slice(1).map((sub) => (
                            <li key={sub}>
                              <Link
                                to={`/catalogo?categoria=${encodeURIComponent(cat)}&subcategoria=${encodeURIComponent(sub)}`}
                                onClick={cerrarMenuMovil}
                                className="block pl-8 pr-4 py-2 text-sm text-parchment/80 hover:text-brass transition-colors"
                              >
                                {traducirSubcategoria(sub, lang, cat)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={`/catalogo?categoria=${encodeURIComponent(cat)}`}
                      onClick={cerrarMenuMovil}
                      className="block px-4 py-3 text-parchment hover:text-brass transition-colors font-mono text-xs uppercase tracking-widest"
                    >
                      {traducirCategoria(cat, lang)}
                    </Link>
                  )}
                </li>
              )
            })}

            <li className="border-b border-line/60">
              <Link
                to="/entrega"
                onClick={cerrarMenuMovil}
                className="block px-4 py-3 text-parchment hover:text-brass transition-colors font-mono text-xs uppercase tracking-widest"
              >
                {t('navbar.delivery')}
              </Link>
            </li>
            <li className="border-b border-line/60">
              <Link
                to="/contacto"
                onClick={cerrarMenuMovil}
                className="block px-4 py-3 text-parchment hover:text-brass transition-colors font-mono text-xs uppercase tracking-widest"
              >
                {t('navbar.contactUs')}
              </Link>
            </li>
            {session && (
              <li>
                <Link
                  to="/admin"
                  onClick={cerrarMenuMovil}
                  className="block px-4 py-3 text-brass hover:text-parchment transition-colors font-mono text-xs uppercase tracking-widest"
                >
                  {t('navbar.admin')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  )
}

function IconoFacebook({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.2h2.2l.3-2.6h-2.5V9.4c0-.75.2-1.3 1.3-1.3h1.4V5.6c-.25-.03-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.2H8.6v2.6h2.2V21"
      />
    </svg>
  )
}

function IconoInstagram({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconoTikTok({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5v11.8a3.7 3.7 0 11-3.2-3.67" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 3.5c.4 2.3 2 4.1 4.5 4.4" />
    </svg>
  )
}
