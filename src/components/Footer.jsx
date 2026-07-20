export default function Footer() {
  return (
    <footer className="border-t border-line mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between gap-6 text-sm text-muted">
        <div>
          <p className="font-display text-parchment text-base">Custom &amp; Designs</p>
          <p className="font-mono text-[11px] tracking-widest text-brass uppercase mt-1">
            The Exelencia Furniture
          </p>
        </div>
        <div className="font-mono text-xs uppercase tracking-wide space-y-1">
          <p>Taller y showroom con cita previa</p>
          <p>14709 S Western Ave, Gardena, CA 90249</p>
          <p>hola@exelenciafurniture.mx · WhatsApp 55 0000 0000</p>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} Exelencia Furniture. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
