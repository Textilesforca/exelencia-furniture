import { supabase } from './supabaseClient'

const BUCKET = 'productos-imagenes'
const MARCADOR = `/${BUCKET}/`

export async function eliminarArchivoStorage(url) {
  if (!url) return
  const indice = url.indexOf(MARCADOR)
  if (indice === -1) return
  const ruta = url.slice(indice + MARCADOR.length)
  await supabase.storage.from(BUCKET).remove([ruta])
}
