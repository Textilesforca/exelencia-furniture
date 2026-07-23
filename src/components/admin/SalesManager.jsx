import { Fragment, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { useLanguage } from '../../i18n/LanguageContext'
import { traducirCategoria, traducirSubcategoria } from '../../i18n/translations'

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
  const { lang, t } = useLanguage()
  const [ventas, setVentas] = useState([])
  const [piezas, setPiezas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('hoy')
  const [vista, setVista] = useState('dinero')
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [categoriasExpandidas, setCategoriasExpandidas] = useState(new Set())

  function toggleCategoria(categoria) {
    setCategoriasExpandidas((actuales) => {
      const nuevas = new Set(actuales)
      if (nuevas.has(categoria)) nuevas.delete(categoria)
      else nuevas.add(categoria)
      return nuevas
    })
  }

  useEffect(() => {
    async function cargar() {
      setCargando(true)
      const [ventasRes, piezasRes] = await Promise.all([
        supabase.rpc('listar_ventas'),
        supabase.rpc('listar_piezas_vendidas'),
      ])
      if (ventasRes.error) setError(ventasRes.error.message)
      else if (piezasRes.error) setError(piezasRes.error.message)
      setVentas(ventasRes.data ?? [])
      setPiezas(piezasRes.data ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const ventasFiltradas = useMemo(() => {
    const desde = limiteDesde(filtro)
    return ventas.filter((v) => new Date(v.creado_en) >= desde)
  }, [ventas, filtro])

  const piezasPorCategoria = useMemo(() => {
    const desde = limiteDesde(filtro)
    const porCategoria = {}
    for (const p of piezas) {
      if (new Date(p.creado_en) < desde) continue
      const cantidad = Number(p.cantidad || 0)
      const subNombre = p.subcategoria || null
      if (!porCategoria[p.categoria]) porCategoria[p.categoria] = { cantidad: 0, subcategorias: {} }
      porCategoria[p.categoria].cantidad += cantidad
      porCategoria[p.categoria].subcategorias[subNombre] =
        (porCategoria[p.categoria].subcategorias[subNombre] || 0) + cantidad
    }
    return Object.entries(porCategoria)
      .map(([categoria, { cantidad, subcategorias }]) => ({
        categoria,
        cantidad,
        subcategorias: Object.entries(subcategorias)
          .map(([subcategoria, cantidad]) => ({ subcategoria, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad),
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [piezas, filtro])

  const total = ventasFiltradas.reduce((suma, v) => suma + Number(v.monto || 0), 0)
  const totalPiezas = piezasPorCategoria.reduce((suma, p) => suma + p.cantidad, 0)

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

  function nuevaPagina(doc, margenX) {
    const y = 50
    doc.setFont(undefined, 'bold')
    doc.setFontSize(16)
    doc.text(vista === 'dinero' ? t('salesManager.reporteTitulo') : t('salesManager.reportePiezasTitulo'), margenX, y)
    return y
  }

  function handleGenerarPdfDinero() {
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
      y = nuevaPagina(doc, margenX)
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
  }

  function handleGenerarPdfPiezas() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
    const margenX = 40
    const anchoUtil = 612 - margenX * 2
    const colCategoria = margenX
    const colCantidad = margenX + anchoUtil

    let y = 50

    function encabezado() {
      y = nuevaPagina(doc, margenX)
      y += 20
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`${t('salesManager.periodo')}: ${filtroLabel(filtro)}`, margenX, y)
      doc.text(`${t('salesManager.generadoEl')}: ${new Date().toLocaleString()}`, colCantidad, y, { align: 'right' })
      y += 20

      doc.setFont(undefined, 'bold')
      doc.text(t('salesManager.categoria'), colCategoria, y)
      doc.text(t('salesManager.piezasVendidas'), colCantidad, y, { align: 'right' })
      doc.setFont(undefined, 'normal')
      y += 8
      doc.setLineWidth(0.5)
      doc.line(margenX, y, margenX + anchoUtil, y)
      y += 14
    }

    encabezado()
    doc.setFontSize(10)

    for (const p of piezasPorCategoria) {
      if (y > 740) {
        doc.addPage()
        encabezado()
        doc.setFontSize(10)
      }

      doc.text(traducirCategoria(p.categoria, lang), colCategoria, y)
      doc.text(String(p.cantidad), colCantidad, y, { align: 'right' })
      y += 18
    }

    y += 8
    doc.setLineWidth(0.5)
    doc.line(margenX, y, margenX + anchoUtil, y)
    y += 18
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text(`${t('salesManager.total')}: ${totalPiezas}`, colCantidad, y, { align: 'right' })

    doc.save(`piezas-vendidas-${filtro}-${Date.now()}.pdf`)
  }

  function handleGenerarPdf() {
    setGenerandoPdf(true)
    if (vista === 'dinero') handleGenerarPdfDinero()
    else handleGenerarPdfPiezas()
    setGenerandoPdf(false)
  }

  if (cargando) {
    return <p className="font-mono text-sm text-muted">{t('salesManager.cargando')}</p>
  }

  const sinDatos = vista === 'dinero' ? ventasFiltradas.length === 0 : piezasPorCategoria.length === 0

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl text-parchment">{t('salesManager.titulo')}</h2>
        <button
          type="button"
          onClick={handleGenerarPdf}
          disabled={generandoPdf || sinDatos}
          className="font-mono text-xs uppercase tracking-widest bg-brass text-ink font-medium px-5 py-2.5 rounded-sm hover:bg-walnut2 transition-colors disabled:opacity-50"
        >
          {generandoPdf ? t('salesManager.generando') : t('salesManager.generarReporte')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['dinero', 'piezas'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-sm border transition-colors ${
              vista === v
                ? 'border-brass text-brass bg-brass/10'
                : 'border-line text-muted hover:text-parchment hover:border-brass/60'
            }`}
          >
            {v === 'dinero' ? t('salesManager.vistaDinero') : t('salesManager.vistaPiezas')}
          </button>
        ))}
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

      {vista === 'dinero' ? (
        ventasFiltradas.length === 0 ? (
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
        )
      ) : piezasPorCategoria.length === 0 ? (
        <p className="font-mono text-sm text-muted">{t('salesManager.vacio')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-widest text-muted border-b border-line">
                <th className="py-2 pr-4 font-normal">{t('salesManager.categoria')}</th>
                <th className="py-2 font-normal text-right">{t('salesManager.piezasVendidas')}</th>
              </tr>
            </thead>
            <tbody>
              {piezasPorCategoria.map((p) => {
                const expandida = categoriasExpandidas.has(p.categoria)
                const tieneSubcategorias = p.subcategorias.length > 1 || p.subcategorias[0]?.subcategoria
                return (
                  <Fragment key={p.categoria}>
                    <tr className="border-b border-line/60 text-parchment/90">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {tieneSubcategorias ? (
                            <button
                              type="button"
                              onClick={() => toggleCategoria(p.categoria)}
                              aria-label={expandida ? t('salesManager.colapsar') : t('salesManager.expandir')}
                              className="w-5 h-5 flex items-center justify-center border border-line rounded-sm text-brass hover:border-brass/60 transition-colors shrink-0"
                            >
                              {expandida ? '−' : '+'}
                            </button>
                          ) : (
                            <span className="w-5 h-5 shrink-0" />
                          )}
                          {traducirCategoria(p.categoria, lang)}
                        </div>
                      </td>
                      <td className="py-2 font-mono text-walnut2 text-right">{p.cantidad}</td>
                    </tr>
                    {expandida &&
                      p.subcategorias.map((s) => (
                        <tr key={`${p.categoria}::${s.subcategoria}`} className="border-b border-line/60 text-parchment/70">
                          <td className="py-2 pr-4 pl-9 text-sm">
                            {s.subcategoria
                              ? traducirSubcategoria(s.subcategoria, lang, p.categoria)
                              : t('productManager.sinSubcategoria')}
                          </td>
                          <td className="py-2 font-mono text-right">{s.cantidad}</td>
                        </tr>
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>

          <div className="flex justify-end mt-4 pt-4 border-t border-line">
            <p className="font-mono text-sm text-parchment">
              {t('salesManager.total')}: <span className="text-walnut2">{totalPiezas}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
