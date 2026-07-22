import { useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabaseClient'
import LoginForm from '../components/admin/LoginForm'
import ProductManager from '../components/admin/ProductManager'
import QuotesList from '../components/admin/QuotesList'
import UserManager from '../components/admin/UserManager'
import BannerManager from '../components/admin/BannerManager'
import CatalogoManager from '../components/admin/CatalogoManager'
import { useLanguage } from '../i18n/LanguageContext'

export default function Admin() {
  const { t } = useLanguage()
  const { session, cargando } = useSession()
  const { profile, cargando: cargandoPerfil } = useProfile(session)
  const [tab, setTab] = useState(null)

  const esAdmin = profile?.role === 'admin'
  const tabsDisponibles = [
    (esAdmin || profile?.permisos?.productos) && 'productos',
    (esAdmin || profile?.permisos?.cotizaciones) && 'cotizaciones',
    (esAdmin || profile?.permisos?.banner) && 'banner',
    (esAdmin || profile?.permisos?.catalogo) && 'catalogo',
    esAdmin && 'usuarios',
  ].filter(Boolean)

  useEffect(() => {
    if (!tab && tabsDisponibles.length > 0) {
      setTab(tabsDisponibles[0])
    }
  }, [tabsDisponibles, tab])

  if (cargando || (session && cargandoPerfil)) {
    return <p className="max-w-6xl mx-auto px-6 py-16 font-mono text-sm text-muted">{t('admin.cargando')}</p>
  }

  if (!session) {
    return <LoginForm />
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('admin.panelPrivado')}</p>
          <h1 className="font-display text-4xl text-parchment">{t('admin.administracion')}</h1>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="font-mono text-xs uppercase tracking-widest text-muted hover:text-brass transition-colors"
        >
          {t('admin.cerrarSesion')}
        </button>
      </div>

      {tabsDisponibles.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('admin.sinPermisos')}</p>
      ) : (
        <>
          <div className="flex gap-6 border-b border-line mb-10">
            {tabsDisponibles.includes('productos') && (
              <TabButton active={tab === 'productos'} onClick={() => setTab('productos')}>
                {t('admin.tabProductos')}
              </TabButton>
            )}
            {tabsDisponibles.includes('cotizaciones') && (
              <TabButton active={tab === 'cotizaciones'} onClick={() => setTab('cotizaciones')}>
                {t('admin.tabCotizaciones')}
              </TabButton>
            )}
            {tabsDisponibles.includes('banner') && (
              <TabButton active={tab === 'banner'} onClick={() => setTab('banner')}>
                {t('admin.tabBanner')}
              </TabButton>
            )}
            {tabsDisponibles.includes('catalogo') && (
              <TabButton active={tab === 'catalogo'} onClick={() => setTab('catalogo')}>
                {t('admin.tabCatalogo')}
              </TabButton>
            )}
            {tabsDisponibles.includes('usuarios') && (
              <TabButton active={tab === 'usuarios'} onClick={() => setTab('usuarios')}>
                {t('admin.tabUsuarios')}
              </TabButton>
            )}
          </div>

          {tab === 'productos' && <ProductManager />}
          {tab === 'cotizaciones' && <QuotesList />}
          {tab === 'banner' && <BannerManager />}
          {tab === 'catalogo' && <CatalogoManager />}
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
