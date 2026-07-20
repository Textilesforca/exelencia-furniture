import { useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabaseClient'
import LoginForm from '../components/admin/LoginForm'
import ProductManager from '../components/admin/ProductManager'
import QuotesList from '../components/admin/QuotesList'
import UserManager from '../components/admin/UserManager'

export default function Admin() {
  const { session, cargando } = useSession()
  const { profile, cargando: cargandoPerfil } = useProfile(session)
  const [tab, setTab] = useState(null)

  const esAdmin = profile?.role === 'admin'
  const tabsDisponibles = [
    (esAdmin || profile?.permisos?.productos) && 'productos',
    (esAdmin || profile?.permisos?.cotizaciones) && 'cotizaciones',
    esAdmin && 'usuarios',
  ].filter(Boolean)

  useEffect(() => {
    if (!tab && tabsDisponibles.length > 0) {
      setTab(tabsDisponibles[0])
    }
  }, [tabsDisponibles, tab])

  if (cargando || (session && cargandoPerfil)) {
    return <p className="max-w-6xl mx-auto px-6 py-16 font-mono text-sm text-muted">Cargando…</p>
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Panel privado</p>
          <h1 className="font-display text-4xl text-parchment">Administración</h1>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="font-mono text-xs uppercase tracking-widest text-muted hover:text-brass transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {tabsDisponibles.length === 0 ? (
        <p className="font-mono text-sm text-muted">
          No tienes permisos asignados. Contacta al administrador.
        </p>
      ) : (
        <>
          <div className="flex gap-6 border-b border-line mb-10">
            {tabsDisponibles.includes('productos') && (
              <TabButton active={tab === 'productos'} onClick={() => setTab('productos')}>
                Productos
              </TabButton>
            )}
            {tabsDisponibles.includes('cotizaciones') && (
              <TabButton active={tab === 'cotizaciones'} onClick={() => setTab('cotizaciones')}>
                Cotizaciones
              </TabButton>
            )}
            {tabsDisponibles.includes('usuarios') && (
              <TabButton active={tab === 'usuarios'} onClick={() => setTab('usuarios')}>
                Usuarios
              </TabButton>
            )}
          </div>

          {tab === 'productos' && <ProductManager />}
          {tab === 'cotizaciones' && <QuotesList />}
          {tab === 'usuarios' && <UserManager />}
        </>
      )}
    </section>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 font-mono text-xs uppercase tracking-widest border-b transition-colors ${
        active ? 'text-brass border-brass' : 'text-muted border-transparent hover:text-parchment'
      }`}
    >
      {children}
    </button>
  )
}
