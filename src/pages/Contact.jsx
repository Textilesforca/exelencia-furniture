import QuoteForm from '../components/QuoteForm'
import BlueprintDivider from '../components/BlueprintDivider'

export default function Contact() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
      <div>
        <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Empecemos con un plano</p>
        <h1 className="font-display text-4xl text-parchment mb-6">Cuéntanos qué mueble necesitas</h1>
        <p className="text-parchment/70 max-w-md">
          Cuanto más nos digas sobre el espacio, el uso diario y tus referencias, más preciso será el primer plano
          que te mostremos. Respondemos en menos de 24 horas.
        </p>
        <div className="my-8">
          <BlueprintDivider />
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-muted space-y-2">
          <p>Taller y showroom con cita previa</p>
          <p>hola@exelenciafurniture.mx</p>
          <p>WhatsApp 55 0000 0000</p>
        </div>
      </div>

      <QuoteForm />
    </section>
  )
}
