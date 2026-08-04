import QuoteForm from '../components/QuoteForm'
import BlueprintDivider from '../components/BlueprintDivider'
import { useLanguage } from '../i18n/LanguageContext'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function Contact() {
  const { t } = useLanguage()

  useDocumentHead({
    titulo: 'Cotizar y contacto | Custom & Designs — The Exelencia Furniture',
    descripcion: 'Pide una cotización de tu mueble a la medida en Gardena, CA. Visitamos tu hogar en el área de Los Ángeles o recibimos tus medidas.',
    ruta: '/contacto',
  })

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-4xl text-parchment mb-6">{t('contact.titulo')}</h1>
        <p className="text-parchment/70 max-w-md">{t('contact.intro')}</p>

        <p className="font-display text-2xl text-parchment mt-8 mb-3">{t('contact.materialesTitulo')}</p>
        <p className="text-parchment/70 max-w-md">{t('contact.materialesTexto')}</p>

        <div className="my-8">
          <BlueprintDivider />
        </div>

        <div className="font-mono text-xs uppercase tracking-widest text-muted space-y-2">
          <p>14709 S Western Ave, Gardena, CA 90249</p>
          <p>{t('contact.telefono')} (323) 507-1945</p>
          <p>{t('contact.whatsapp')} (323) 507-1945</p>
          <p>
            {t('contact.horario')} {t('contact.horarioValor')}
          </p>
        </div>

        <div className="my-8">
          <BlueprintDivider />
        </div>

        <p className="font-display text-2xl text-parchment mb-3">{t('contact.formTitulo')}</p>
        <p className="text-parchment/70 max-w-md">{t('contact.formTexto')}</p>
      </div>

      <QuoteForm />
    </section>
  )
}
