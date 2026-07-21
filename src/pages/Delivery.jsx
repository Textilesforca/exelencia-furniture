import BlueprintDivider from '../components/BlueprintDivider'
import { useLanguage } from '../i18n/LanguageContext'

export default function Delivery() {
  const { t } = useLanguage()

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl text-parchment mb-4">{t('delivery.titulo')}</h1>
      <p className="text-parchment/70 max-w-lg mb-10">{t('delivery.intro')}</p>

      <div className="grid sm:grid-cols-2 gap-10">
        <div>
          <BlueprintDivider label={t('delivery.entregaTitulo')} />
          <p className="font-mono text-sm text-walnut2 mt-6 mb-4">{t('delivery.entregaSubtitulo')}</p>
          <ul className="space-y-3 text-parchment/80 text-sm">
            {t('delivery.entregaItems').map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-brass shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <BlueprintDivider label={t('delivery.recoleccionTitulo')} />
          <p className="font-mono text-sm text-walnut2 mt-6 mb-4">{t('delivery.recoleccionSubtitulo')}</p>
          <ul className="space-y-3 text-parchment/80 text-sm">
            {t('delivery.recoleccionItems').map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-brass shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
