import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { traducirCategoria } from '../i18n/translations'

export default function ProductCard({ producto }) {
  const { lang, t } = useLanguage()
  const nombre = producto.nombre
  const material = producto.material

  return (
    <Link
      to={`/catalogo/${producto.id}`}
      className="group flex flex-col sm:flex-row bg-surface border border-line rounded-sm overflow-hidden hover:border-brass/60 transition-colors"
    >
      <div className="relative w-full sm:w-56 aspect-[4/3] sm:aspect-square shrink-0 overflow-hidden bg-surface2">
        <img
          src={producto.imagen}
          alt={nombre}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-5 flex-1 min-w-0">
        <p className="font-mono text-[10px] tracking-widest text-brass uppercase">
          {traducirCategoria(producto.categoria, lang)}
        </p>
        <h3 className="font-display text-xl text-parchment mt-1">{nombre}</h3>
        <p className="text-sm text-muted mt-1">{material}</p>

        <div className="grid grid-cols-3 gap-2 font-mono text-xs text-parchment/80 mt-4 max-w-xs">
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

        <p className="font-mono text-sm text-walnut2 mt-4">
          {t('productCard.desde')} ${Number(producto.precio_desde).toLocaleString('en-US')} USD
        </p>

        {producto.colores?.length > 0 && (
          <div className="mt-3">
            <p className="font-mono text-[10px] tracking-widest text-muted uppercase mb-1.5">
              {t('productCard.disponibleEn')}
            </p>
            <div className="flex items-center gap-1.5">
              {producto.colores.map((color) => (
                <span
                  key={color.nombre}
                  title={color.nombre}
                  style={{ backgroundColor: color.hex }}
                  className="w-4 h-4 rounded-full border border-line"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
