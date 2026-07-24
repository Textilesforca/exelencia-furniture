import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../i18n/LanguageContext'
import { useCart } from '../cart/CartContext'
import { cargarImagenComoDataUrl } from '../lib/cargarImagenComoDataUrl'

function itemsDeResultado(tipo, resultado, t) {
  if (tipo === 'cotizacion') {
    const concepto = resultado.concepto === 'resto' ? t('paymentSuccess.resto') : t('paymentSuccess.anticipo')
    return [
      {
        descripcion: `${concepto} — ${resultado.nombre}`,
        cantidad: 1,
        precioUnitario: Number(resultado.monto),
        importe: Number(resultado.monto),
      },
    ]
  }

  const items =
    tipo === 'carrito'
      ? resultado.items.map((item) => ({
          descripcion: item.color ? `${item.nombre} (${item.color})` : item.nombre,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precio),
          importe: item.cantidad * Number(item.precio),
        }))
      : [
          {
            descripcion: resultado.color
              ? `${resultado.nombre_producto} (${resultado.color})`
              : resultado.nombre_producto,
            cantidad: 1,
            precioUnitario: Number(resultado.monto),
            importe: Number(resultado.monto),
          },
        ]

  if (resultado.metodo_envio === 'flete' && Number(resultado.monto_flete) > 0) {
    items.push({
      descripcion: t('paymentSuccess.servicioFlete'),
      cantidad: 1,
      precioUnitario: Number(resultado.monto_flete),
      importe: Number(resultado.monto_flete),
    })
  }

  return items
}

async function generarRemision(tipo, resultado, sessionId, t) {
  const items = itemsDeResultado(tipo, resultado, t)
  const total = items.reduce((suma, i) => suma + i.importe, 0)
  const cliente = resultado.nombre_cliente || resultado.nombre || t('paymentSuccess.clienteGenerico')
  const folio = (resultado.id ? resultado.id.slice(0, 8) : sessionId.slice(-8)).toUpperCase()
  const fecha = resultado.creado_en ? new Date(resultado.creado_en) : new Date()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const margenX = 40
  const anchoUtil = 612 - margenX * 2
  const colDesc = margenX
  const colCant = margenX + 320
  const colPrecio = margenX + 400
  const colImporte = margenX + anchoUtil

  let textoX = margenX
  try {
    const { dataUrl } = await cargarImagenComoDataUrl('/logo.png')
    doc.addImage(dataUrl, 'JPEG', margenX, 30, 34, 34)
    textoX = margenX + 44
  } catch {
    // si el logo no carga, seguimos sin él
  }

  let y = 44

  doc.setFont(undefined, 'bold')
  doc.setFontSize(16)
  doc.text('THE EXELENCIA FURNITURE', textoX, y)
  y += 18
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.text('14709 S Western Ave, Gardena, CA 90249', textoX, y)

  doc.setFont(undefined, 'bold')
  doc.setFontSize(18)
  doc.text(t('paymentSuccess.remisionTitulo').toUpperCase(), colImporte, 44, { align: 'right' })
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.text(`${t('paymentSuccess.folio')}: ${folio}`, colImporte, 62, { align: 'right' })
  doc.text(`${t('paymentSuccess.fecha')}: ${fecha.toLocaleString()}`, colImporte, 75, { align: 'right' })

  y = 75
  y += 15
  doc.setLineWidth(0.5)
  doc.line(margenX, y, margenX + anchoUtil, y)
  y += 18

  doc.setFontSize(10)
  doc.text(`${t('paymentSuccess.cliente')}: ${cliente}`, margenX, y)
  y += 24

  doc.setFont(undefined, 'bold')
  doc.text(t('paymentSuccess.descripcion'), colDesc, y)
  doc.text(t('paymentSuccess.cantidad'), colCant, y)
  doc.text(t('paymentSuccess.precioUnitario'), colPrecio, y)
  doc.text(t('paymentSuccess.importe'), colImporte, y, { align: 'right' })
  doc.setFont(undefined, 'normal')
  y += 8
  doc.line(margenX, y, margenX + anchoUtil, y)
  y += 16

  for (const item of items) {
    doc.text(String(item.descripcion).slice(0, 55), colDesc, y)
    doc.text(String(item.cantidad), colCant, y)
    doc.text(`$${item.precioUnitario.toLocaleString('en-US')}`, colPrecio, y)
    doc.text(`$${item.importe.toLocaleString('en-US')}`, colImporte, y, { align: 'right' })
    y += 18
  }

  y += 8
  doc.line(margenX, y, margenX + anchoUtil, y)
  y += 20
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.text(`${t('paymentSuccess.total')}: $${total.toLocaleString('en-US')} USD`, colImporte, y, { align: 'right' })

  if (resultado.metodo_envio === 'flete' && Number(resultado.monto_flete) > 0) {
    y += 34
    if (y > 700) {
      doc.addPage()
      y = 55
    }
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text(t('paymentSuccess.notaFleteTitulo'), margenX, y)
    y += 16
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    const notaItems = t('paymentSuccess.notaFleteItems')
    notaItems.forEach((linea, i) => {
      if (y > 730) {
        doc.addPage()
        y = 55
      }
      doc.text(linea, margenX, y)
      y += 14
      if (i < notaItems.length - 1) {
        doc.text('—', margenX, y)
        y += 14
      }
    })
  }

  y += 30
  if (y > 730) {
    doc.addPage()
    y = 55
  }
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.text(t('paymentSuccess.remisionAviso'), margenX, y)
  y += 14
  doc.text(t('paymentSuccess.gracias'), margenX, y)

  doc.save(`remision-${folio}.pdf`)
}

export default function PaymentSuccess() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const tipo = searchParams.get('tipo')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { vaciar } = useCart()
  const descargadaRef = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      setCargando(false)
      return
    }

    async function cargar() {
      const rpc =
        tipo === 'cotizacion'
          ? 'get_cotizacion_pago_by_session'
          : tipo === 'carrito'
            ? 'get_carrito_orden_by_session'
            : 'get_pedido_by_session'
      const { data } = await supabase.rpc(rpc, { p_session_id: sessionId })
      const fila = data?.[0] ?? null
      setResultado(fila)
      setCargando(false)
      if (tipo === 'carrito' && fila?.estado === 'pagado') vaciar()
      if (fila?.estado === 'pagado' && !descargadaRef.current) {
        descargadaRef.current = true
        await generarRemision(tipo, fila, sessionId, t)
      }
    }

    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, tipo])

  return (
    <section className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.25em] text-brass uppercase mb-3">{t('paymentSuccess.kicker')}</p>
      <h1 className="font-display text-4xl text-parchment mb-6">{t('paymentSuccess.titulo')}</h1>

      {cargando ? (
        <p className="font-mono text-sm text-muted">{t('paymentSuccess.confirmando')}</p>
      ) : resultado && tipo === 'carrito' ? (
        <div className="font-mono text-sm text-parchment/90">
          <ul className="text-left space-y-2 mb-4">
            {resultado.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-4 border-b border-line pb-2">
                <span>
                  {item.nombre}
                  {item.color ? ` (${item.color})` : ''} × {item.cantidad}
                </span>
                <span className="text-walnut2 shrink-0">
                  ${(item.cantidad * Number(item.precio)).toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-walnut2">${Number(resultado.monto).toLocaleString('en-US')} USD</p>
          <p className="text-muted uppercase tracking-widest text-xs mt-2">
            {t('paymentSuccess.estado')}: {resultado.estado}
          </p>
        </div>
      ) : resultado ? (
        <div className="font-mono text-sm text-parchment/90 space-y-2">
          {resultado.concepto && (
            <p className="text-brass uppercase tracking-widest text-xs">
              {resultado.concepto === 'resto' ? t('paymentSuccess.resto') : t('paymentSuccess.anticipo')}
            </p>
          )}
          <p>{resultado.nombre_producto ?? resultado.nombre}</p>
          <p className="text-walnut2">${Number(resultado.monto).toLocaleString('en-US')} USD</p>
          <p className="text-muted uppercase tracking-widest text-xs">
            {t('paymentSuccess.estado')}: {resultado.estado}
          </p>
        </div>
      ) : (
        <p className="font-mono text-sm text-muted">{t('paymentSuccess.noEncontrado')}</p>
      )}

      {resultado?.estado === 'pagado' && (
        <button
          type="button"
          onClick={() => generarRemision(tipo, resultado, sessionId, t)}
          className="inline-block mt-6 border border-brass text-brass font-body font-medium px-6 py-3 rounded-sm hover:bg-brass hover:text-ink transition-colors"
        >
          {t('paymentSuccess.descargarRemision')}
        </button>
      )}

      <div>
        <Link
          to="/catalogo"
          className="inline-block mt-6 bg-brass text-ink font-body font-medium px-6 py-3 rounded-sm hover:bg-walnut2 transition-colors"
        >
          {t('paymentSuccess.volverCatalogo')}
        </Link>
      </div>
    </section>
  )
}
