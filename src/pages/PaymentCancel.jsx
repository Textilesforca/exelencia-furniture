import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export default function PaymentCancel() {
  const { t } = useLanguage()

  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('paymentCancel.kicker')}</p>
      <h1 className="font-display text-4xl text-parchment mb-6">{t('paymentCancel.titulo')}</h1>
      <p className="font-mono text-sm text-muted">{t('paymentCancel.texto')}</p>

      <Link
        to="/catalogo"
        className="inline-block mt-10 bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
      >
        {t('paymentCancel.volverCatalogo')}
      </Link>
    </section>
  )
}
