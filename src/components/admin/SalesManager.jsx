import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'

const FILTROS = ['hoy', 'semana', 'mes', 'anio']

function inicioDeHoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function limiteDesde(filtro) {
  const ahora = new Date()
  if (filtro === 'hoy') return inicioDeHoy()
  if (filtro === 'semana') {
    const d = inicioDeHoy()
    d.setDate(d.getDate() - 6)
    return d
  }
  if (filtro === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  return new Date(ahora.getFullYear(), 0, 1)
}

export default function SalesManager() {
  const { t } = useLanguage()
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('hoy')
  const [generandoPdf, setGenerandoPdf] = useState(false)

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const { data, error } = await supabase.rpc('listar_ventas')
      if (error) setError(error.message)
      setVentas(data ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const ventasFiltradas = useMemo(() => {
    const desde = limiteDesde(filtro)
    return ventas.filter((v) => new Date(v.creado_en) >= desde)
  }, [ventas, filtro])

  const total = ventasFiltradas.reduce((suma, v) => suma + Number(v.monto || 0), 0)

  function tipoLabel(tipo) {
    if (tipo === 'producto') return t('salesManager.tipoProducto')
    if (tipo === 'carrito') return t('salesManager.tipoCarrito')
    return t('salesManager.tipoAnticipo')
  }

  function filtroLabel(f) {
    if (f === 'hoy') return t('salesManager.hoy')
    if (f === 'semana') return t('salesManager.semana')
    if (f === 'mes') return t('salesManager.mes')
    return t('salesManager.anio')
  }

  function handleGenerarPdf() {
    setGenerandoPdf(true)

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
    const margenX = 40
    const anchoUtil = 612 - margenX * 2
    const colFecha = margenX
    const colTipo = margenX + 80
    const colDesc = margenX + 150
    const colCliente = margenX + 340
    const colMonto = margenX + anchoUtil

    let y = 50

    function encabezado() {
      doc.setFont(undefined, 'bold')
      doc.setFontSize(16)
      doc.text(t('salesManager.reporteTitulo'), margenX, y)
      y += 20
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`${t('salesManager.periodo')}: ${filtroLabel(filtro)}`, margenX, y)
      doc.text(`${t('salesManager.generadoEl')}: ${new Date().toLocaleString()}`, colMonto, y, { align: 'right' })
      y += 20

      doc.setFont(undefined, 'bold')
      doc.text(t('salesManager.fecha'), colFecha, y)
      doc.text(t('salesManager.tipo'), colTipo, y)
      doc.text(t('salesManager.descripcion'), colDesc, y)
      doc.text(t('salesManager.cliente'), colCliente, y)
      doc.text(t('salesManager.monto'), colMonto, y, { align: 'right' })
      doc.setFont(undefined, 'normal')
      y += 8
      doc.setLineWidth(0.5)
      doc.line(margenX, y, margenX + anchoUtil, y)
      y += 14
    }

    encabezado()
    doc.setFontSize(9)

    for (const v of ventasFiltradas) {
      if (y > 740) {
        doc.addPage()
        y = 50
        encabezado()
        doc.setFontSize(9)
      }

      doc.text(new Date(v.creado_en).toLocaleDateString(), colFecha, y)
      doc.text(tipoLabel(v.tipo), colTipo, y)
      doc.text((v.descripcion || '').slice(0, 45), colDesc, y)
      doc.text((v.cliente || '—').slice(0, 22), colCliente, y)
      doc.text(`$${Number(v.monto).toLocaleString('en-US')}`, colMonto, y, { align: 'right' })
      y += 16
    }

    y += 10
    doc.setLineWidth(0.5)
    doc.line(margenX, y, margenX + anchoUtil, y)
    y += 18
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text(`${t('salesManager.total')}: $${total.toLocaleString('en-US')} USD`, colMonto, y, { align: 'right' })

    doc.save(`ventas-${filtro}-${Date.now()}.pdf`)
    setGenerandoPdf(false)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('salesManager.cargando')}</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl text-parchment">{t('salesManager.titulo')}</h2>
        <button
          type="button"
          onClick={handleGenerarPdf}
          disabled={generandoPdf || ventasFiltradas.length === 0}
          className="font-mono text-xs uppercase tracking-widest bg-brass text-ink font-medium px-5 py-2.5 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50"
        >
          {generandoPdf ? t('salesManager.generando') : t('salesManager.generarReporte')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-sm border transition-colors ${
              filtro === f
                ? 'border-brass text-brass'
                : 'border-line text-muted hover:text-parchment hover:border-brass/60'
            }`}
          >
            {filtroLabel(f)}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {ventasFiltradas.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('salesManager.vacio')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-widest text-muted border-b border-line">
                <th className="py-2 pr-4 font-normal">{t('salesManager.fecha')}</th>
                <th className="py-2 pr-4 font-normal">{t('salesManager.tipo')}</th>
                <th className="py-2 pr-4 font-normal">{t('salesManager.descripcion')}</th>
                <th className="py-2 pr-4 font-normal">{t('salesManager.cliente')}</th>
                <th className="py-2 font-normal text-right">{t('salesManager.monto')}</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((v) => (
                <tr key={`${v.tipo}-${v.id}`} className="border-b border-line/60 text-parchment/90">
                  <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">
                    {new Date(v.creado_en).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{tipoLabel(v.tipo)}</td>
                  <td className="py-2 pr-4 truncate max-w-xs">{v.descripcion || '—'}</td>
                  <td className="py-2 pr-4 truncate max-w-[10rem]">{v.cliente || '—'}</td>
                  <td className="py-2 font-mono text-walnut2 text-right whitespace-nowrap">
                    ${Number(v.monto).toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4 pt-4 border-t border-line">
            <p className="font-mono text-sm text-parchment">
              {t('salesManager.total')}: <span className="text-walnut2">${total.toLocaleString('en-US')} USD</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
