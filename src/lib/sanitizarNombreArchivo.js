const MARCAS_DIACRITICAS = /[̀-ͯ]/g

export function sanitizarNombreArchivo(nombre) {
  return nombre
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '') // quita acentos (marcas diacríticas tras normalizar)
    .replace(/[^a-zA-Z0-9.-]/g, '-') // reemplaza espacios y caracteres especiales
    .replace(/-+/g, '-')
}
