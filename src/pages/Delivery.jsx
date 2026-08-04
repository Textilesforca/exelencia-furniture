import { useLanguage } from '../i18n/LanguageContext'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function Delivery() {
  const { t } = useLanguage()

  useDocumentHead({
    titulo: 'Entregas y recolección | Custom & Designs — The Exelencia Furniture',
    descripcion: 'Recoge tu mueble en nuestro Show Room en Gardena, CA o pide entrega profesional en el sur de California.',
    ruta: '/entrega',
  })

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl text-parchment mb-6">{t('delivery.titulo')}</h1>
      <p className="text-parchment/70 max-w-xl mb-10">{t('delivery.intro')}</p>

      <div className="flex flex-wrap gap-8 mb-16">
        <div className="flex items-center gap-3">
          <IconoCamion className="w-9 h-9 text-brass shrink-0" />
          <span className="font-mono text-sm text-parchment uppercase tracking-widest">
            {t('delivery.servicioProfesional')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <IconoCaja className="w-9 h-9 text-brass shrink-0" />
          <span className="font-mono text-sm text-parchment uppercase tracking-widest">
            {t('delivery.pickup')}
          </span>
        </div>
      </div>

      <div className="border-t border-line pt-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-brass uppercase mb-1">
          The Exelencia Furniture
        </p>
        <p className="font-display text-2xl text-parchment mb-4">Show Room</p>
        <div className="font-mono text-sm text-muted space-y-1.5">
          <p>
            <span className="text-parchment/80 uppercase tracking-widest">{t('contact.horario')}</span>{' '}
            {t('contact.horarioValor')}
          </p>
          <p>14709 S Western Ave, Gardena, CA 90249</p>
          <p>
            <span className="text-parchment/80 uppercase tracking-widest">{t('delivery.telefono')}</span>{' '}
            (323) 507-1945
          </p>
          <p>
            <span className="text-parchment/80 uppercase tracking-widest">{t('delivery.whatsapp')}</span>{' '}
            (323) 507-1945
          </p>
        </div>
      </div>
    </section>
  )
}

function IconoCamion({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h11v10H2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10h4l4 3.2V16h-8z" />
      <circle cx="6.5" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </svg>
  )
}

function IconoCaja({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9-4 9 4-9 4-9-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8v8l9 4 9-4V8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8" />
    </svg>
  )
}
