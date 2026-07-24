import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { cargarImagenComoDataUrl } from '../lib/cargarImagenComoDataUrl'

export default function CatalogViewer({ imagenes, categoria }) {
  const [indice, setIndice] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [mostrarGrid, setMostrarGrid] = useState(false)
  const [mostrarCompartir, setMostrarCompartir] = useState(false)
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const contenedorRef = useRef(null)

  useEffect(() => {
    function handleFullscreenChange() {
      setPantallaCompleta(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (imagenes.length === 0) return null

  const actual = imagenes[indice]
  const urlPagina = typeof window !== 'undefined' ? window.location.href : ''

  function anterior() {
    setZoom(false)
    setIndice((i) => (i - 1 + imagenes.length) % imagenes.length)
  }

  function siguiente() {
    setZoom(false)
    setIndice((i) => (i + 1) % imagenes.length)
  }

  function irAPagina(i) {
    setZoom(false)
    setIndice(i)
    setMostrarGrid(false)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      contenedorRef.current?.requestFullscreen()
    }
  }

  async function handleDescargarPdf() {
    setGenerandoPdf(true)
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      for (let i = 0; i < imagenes.length; i++) {
        const { dataUrl, width, height } = await cargarImagenComoDataUrl(imagenes[i].imagen)
        const escala = Math.min(pageWidth / width, pageHeight / height)
        const w = width * escala
        const h = height * escala
        const x = (pageWidth - w) / 2
        const y = (pageHeight - h) / 2
        if (i > 0) doc.addPage()
        doc.addImage(dataUrl, 'JPEG', x, y, w, h)
      }

      doc.save(`catalogo-${categoria}.pdf`)
    } catch {
      window.alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
    setGenerandoPdf(false)
  }

  function handleImprimir() {
    const ventana = window.open('', '_blank')
    if (!ventana) return
    const imgs = imagenes
      .map((img) => `<img src="${img.imagen}" style="width:100%; page-break-after: always;" />`)
      .join('')
    ventana.document.write(`
      <html>
        <head><title>Imprimir catálogo</title></head>
        <body style="margin:0">${imgs}</body>
      </html>
    `)
    ventana.document.close()
    ventana.onload = () => ventana.print()
  }

  function handleCopiarLink() {
    navigator.clipboard.writeText(urlPagina)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div ref={contenedorRef} className="flex bg-ink">
      <div className="flex flex-col items-center gap-1 bg-surface border-r border-line py-4 px-2 shrink-0">
        <IconButton as={Link} to="/" label="Inicio">
          <IconoInicio />
        </IconButton>
        <IconButton onClick={() => setZoom((z) => !z)} label={zoom ? 'Alejar' : 'Acercar'}>
          {zoom ? <IconoZoomOut /> : <IconoZoomIn />}
        </IconButton>
        <IconButton onClick={() => setMostrarGrid((g) => !g)} label="Vista previa de páginas">
          <IconoGrid />
        </IconButton>
        <IconButton onClick={toggleFullscreen} label={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <IconoExpandir />
        </IconButton>
        <IconButton onClick={handleDescargarPdf} label="Descargar PDF" disabled={generandoPdf}>
          <IconoPdf />
        </IconButton>
        <IconButton onClick={handleImprimir} label="Imprimir">
          <IconoImprimir />
        </IconButton>
        <IconButton onClick={() => setMostrarCompartir((s) => !s)} label="Compartir">
          <IconoCompartir />
        </IconButton>
      </div>

      <div className="relative flex-1 min-w-0">
        {mostrarGrid ? (
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagenes.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => irAPagina(i)}
                  className="relative border border-line hover:border-brass/60 rounded-sm overflow-hidden transition-colors"
                >
                  <span className="absolute top-1 left-1 bg-ink/80 text-parchment text-xs font-mono px-1.5 rounded-sm">
                    {i + 1}
                  </span>
                  <img src={img.imagen} alt="" className="w-full h-auto" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              className={`flex items-center justify-center bg-ink ${
                zoom ? 'h-[70vh] sm:h-[80vh] overflow-auto' : ''
              }`}
            >
              <img
                src={actual.imagen}
                alt=""
                className={
                  zoom
                    ? 'w-auto h-auto scale-150 origin-top-left'
                    : 'max-w-full h-auto max-h-[calc(100vh-240px)] object-contain'
                }
              />
            </div>

            {imagenes.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={anterior}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={siguiente}
                  aria-label="Siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-ink/60 hover:bg-ink/80 text-parchment rounded-sm p-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </>
        )}

        {mostrarCompartir && (
          <div className="absolute top-4 right-4 bg-surface border border-brass/40 rounded-sm shadow-lg p-5 w-72 z-10">
            <p className="font-mono text-xs tracking-widest text-brass uppercase mb-4">Comparte esta página</p>
            <div className="grid gap-3 mb-4">
              <ShareLink href={`https://wa.me/?text=${encodeURIComponent(urlPagina)}`} label="WhatsApp" />
              <ShareLink href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlPagina)}`} label="Facebook" />
              <ShareLink
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(urlPagina)}&media=${encodeURIComponent(actual.imagen)}`}
                label="Pinterest"
              />
              <ShareLink href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(urlPagina)}`} label="X" />
              <ShareLink href={`mailto:?body=${encodeURIComponent(urlPagina)}`} label="Email" />
            </div>
            <p className="font-mono text-[11px] tracking-widest text-muted uppercase mb-2">Copiar enlace</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={urlPagina}
                className="flex-1 bg-surface2 border border-line rounded-sm px-3 py-2 text-xs text-parchment/80"
              />
              <button
                type="button"
                onClick={handleCopiarLink}
                className="font-mono text-xs uppercase tracking-widest text-brass hover:underline shrink-0"
              >
                {copiado ? '✓' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function IconButton({ children, label, as: Comp = 'button', ...props }) {
  return (
    <Comp
      type={Comp === 'button' ? 'button' : undefined}
      aria-label={label}
      title={label}
      className="w-10 h-10 flex items-center justify-center text-parchment/70 hover:text-brass transition-colors disabled:opacity-40"
      {...props}
    >
      {children}
    </Comp>
  )
}

function ShareLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-body text-sm text-parchment/80 hover:text-brass transition-colors"
    >
      {label}
    </a>
  )
}

function IconoInicio() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
    </svg>
  )
}

function IconoZoomIn() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
    </svg>
  )
}

function IconoZoomOut() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35M8 11h6" />
    </svg>
  )
}

function IconoGrid() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
    </svg>
  )
}

function IconoExpandir() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
    </svg>
  )
}

function IconoPdf() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10m0 0l-3.5-3.5M12 13l3.5-3.5M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
    </svg>
  )
}

function IconoImprimir() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9V4h10v5M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v6H7v-6z" />
    </svg>
  )
}

function IconoCompartir() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0-10l-3.5 3.5M12 5l3.5 3.5M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
    </svg>
  )
}
