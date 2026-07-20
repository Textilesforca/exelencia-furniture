import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria, campoTraducido } from '../i18n/translations'

export default function ProductCard({ producto }) {
  const { lang, t } = useLanguage()
  const nombre = campoTraducido(producto, 'nombre', lang)
  const material = campoTraducido(producto, 'material', lang)

  return (
    <Link
      to={`/catalogo/${producto.id}`}
      className="group block bg-surface border border-line rounded-sm overflow-hidden hover:border-brass/60 transition-colors"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface2">
        <img
          src={producto.imagen}
          alt={nombre}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-ink/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="font-mono text-[11px] tracking-widest text-brass uppercase mb-2">{t('productCard.fichaTecnica')}</p>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs text-parchment/90">
            <div>
              <p className="text-muted">{t('productCard.ancho')}</p>
              <p>{producto.ancho} cm</p>
            </div>
            <div>
              <p className="text-muted">{t('productCard.alto')}</p>
              <p>{producto.alto} cm</p>
            </div>
            <div>
              <p className="text-muted">{t('productCard.fondo')}</p>
              <p>{producto.profundidad} cm</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="font-mono text-[10px] tracking-widest text-brass uppercase">
          {traducirCategoria(producto.categoria, lang)}
        </p>
        <h3 className="font-display text-xl text-parchment mt-1">{nombre}</h3>
        <p className="text-sm text-muted mt-1">{material}</p>
        <p className="font-mono text-sm text-walnut2 mt-3">
          {t('productCard.desde')} ${Number(producto.precio_desde).toLocaleString('es-MX')} MXN
        </p>
      </div>
    </Link>
  )
}
