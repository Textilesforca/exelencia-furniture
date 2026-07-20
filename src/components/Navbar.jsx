import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/contacto', label: 'Cotizar' },
]

export default function Navbar() {
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
        <Link
          to="/contacto"
          className="sm:hidden text-xs font-mono uppercase tracking-widest text-brass border border-brass/50 px-3 py-2 rounded-sm"
        >
          Cotizar
        </Link>
      </nav>
    </header>
  )
}
