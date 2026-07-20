import QuoteForm from '../components/QuoteForm'
import BlueprintDivider from '../components/BlueprintDivider'
import { useLanguage } from '../i18n/LanguageContext'

export default function Contact() {
  const { t } = useLanguage()

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
      <div>
        <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('contact.kicker')}</p>
        <h1 className="font-display text-4xl text-parchment mb-6">{t('contact.titulo')}</h1>
        <p className="text-parchment/70 max-w-md">{t('contact.texto')}</p>
        <div className="my-8">
          <BlueprintDivider />
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-muted space-y-2">
          <p>{t('contact.taller')}</p>
          <p>14709 S Western Ave, Gardena, CA 90249</p>
          <p>hola@exelenciafurniture.mx</p>
          <p>WhatsApp 55 0000 0000</p>
        </div>
      </div>

      <QuoteForm />
    </section>
  )
}
