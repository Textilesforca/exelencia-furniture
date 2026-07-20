import { useState } from 'react'
import { useSession } from '../hooks/useSession'
import { supabase } from '../lib/supabaseClient'
import LoginForm from '../components/admin/LoginForm'
import ProductManager from '../components/admin/ProductManager'
import QuotesList from '../components/admin/QuotesList'

export default function Admin() {
  const { session, cargando } = useSession()
  const [tab, setTab] = useState('productos')

  if (cargando) {
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

      <div className="flex gap-6 border-b border-line mb-10">
        <TabButton active={tab === 'productos'} onClick={() => setTab('productos')}>
          Productos
        </TabButton>
        <TabButton active={tab === 'cotizaciones'} onClick={() => setTab('cotizaciones')}>
          Cotizaciones
        </TabButton>
      </div>

      {tab === 'productos' ? <ProductManager /> : <QuotesList />}
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
