import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { useLanguage } from '../i18n/LanguageContext'

export default function Cart() {
  const { t } = useLanguage()
  const { items, quitar, actualizarCantidad } = useCart()

  const total = items.reduce((suma, i) => suma + i.cantidad * Number(i.precio_desde), 0)

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl text-parchment mb-8">{t('cart.titulo')}</h1>

      {items.length === 0 ? (
        <div>
          <p className="font-mono text-sm text-muted mb-6">{t('cart.vacio')}</p>
          <Link
            to="/catalogo"
            className="inline-block bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
          >
            {t('productDetail.volverCatalogo')}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-4 mb-8">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 bg-surface border border-line rounded-sm p-4">
                <img src={item.imagen} alt={item.nombre} className="w-20 h-20 object-cover rounded-sm bg-surface2" />
                <div className="flex-1 min-w-0">
                  <p className="text-parchment">{item.nombre}</p>
                  {item.color && <p className="font-mono text-xs text-muted mt-1">{t('productDetail.color')}: {item.color}</p>}
                  <p className="font-mono text-sm text-walnut2 mt-1">
                    ${Number(item.precio_desde).toLocaleString('en-US')} USD
                  </p>
                </div>
                <div className="flex items-center border border-line rounded-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                    className="w-8 h-8 text-parchment hover:text-brass transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-sm text-parchment">{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                    className="w-8 h-8 text-parchment hover:text-brass transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="font-mono text-sm text-parchment w-24 text-right shrink-0">
                  ${(item.cantidad * Number(item.precio_desde)).toLocaleString('en-US')}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(item.id)}
                  className="font-mono text-xs uppercase tracking-widest text-red-400 hover:underline shrink-0"
                >
                  {t('quotesList.eliminar')}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <p className="font-mono text-lg text-parchment">
              {t('cart.total')}: <span className="text-walnut2">${total.toLocaleString('en-US')} USD</span>
            </p>
          </div>

          <button
            type="button"
            disabled
            className="mt-6 w-full sm:w-auto bg-line text-muted font-body font-medium px-8 py-3 rounded-sm cursor-not-allowed"
          >
            {t('cart.pagoProximamente')}
          </button>
        </>
      )}
    </section>
  )
}
