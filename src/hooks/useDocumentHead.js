import { useEffect } from 'react'

const SITIO = 'https://exelencia-furniture.vercel.app'

function setMeta(atributo, valor, contenido) {
  let tag = document.querySelector(`meta[${atributo}="${valor}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(atributo, valor)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', contenido)
}

function setLink(rel, href) {
  let tag = document.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

// Ajusta el <title>, la meta descripción, el canonical y las etiquetas
// Open Graph de cada página. Es una SPA sin servidor de renderizado, así
// que esto solo lo ven los rastreadores que ejecutan JavaScript (Google sí
// lo hace); no reemplaza tener un dominio propio ni contenido indexable.
export function useDocumentHead({ titulo, descripcion, ruta = '', imagen = '/logo.jpg', noindex = false }) {
  useEffect(() => {
    if (titulo) document.title = titulo
    if (descripcion) setMeta('name', 'description', descripcion)

    const url = `${SITIO}${ruta}`
    setLink('canonical', url)
    setMeta('property', 'og:title', titulo ?? document.title)
    if (descripcion) setMeta('property', 'og:description', descripcion)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', `${SITIO}${imagen}`)
    setMeta('property', 'og:type', 'website')
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
  }, [titulo, descripcion, ruta, imagen, noindex])
}
