import { Link } from 'react-router-dom'

export default function PaymentCancel() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">Pago no completado</p>
      <h1 className="font-display text-4xl text-parchment mb-6">Cancelaste el pago</h1>
      <p className="font-mono text-sm text-muted">
        No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
      </p>

      <Link
        to="/catalogo"
        className="inline-block mt-10 bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
      >
        Volver al catálogo
      </Link>
    </section>
  )
}
